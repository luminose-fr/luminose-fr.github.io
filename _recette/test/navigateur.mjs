/**
 * L'essai en navigateur : la recette, servie par `wrangler dev`, parcourue
 * page à page dans Chromium, chaque requête qui ne vise pas la machine locale
 * interceptée avant de partir, dès le premier chargement, et notée.
 *
 *   PLAYWRIGHT=<chemin du module playwright> RECETTE_MOT_DE_PASSE=… \
 *     node _recette/test/navigateur.mjs <origine> <dossier construit> <rapport>
 *
 * Sur chaque page : le chargement, le défilement, la fenêtre de rendez-vous,
 * les liens coupés et les boutons de paiement, puis chaque formulaire, rempli
 * de valeurs d'essai et envoyé.
 *
 * Ce qui passe la politique de la recette arrive à l'interception : elle ne
 * doit voir que les origines d'affichage (YouTube) et la recette elle-même (les
 * pages de redirection visent recette.luminose.fr). Toute autre origine, toute
 * fenêtre ouverte hors de la machine, tout service worker est un échec.
 * Les appels que la politique a bloqués sont comptés à part : ce sont ceux qui
 * auraient fui sans elle.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const [origine, construit, rapport] = process.argv.slice(2);
const motDePasse = process.env.RECETTE_MOT_DE_PASSE;
if (!origine || !construit || !rapport || !motDePasse) {
  console.error('usage : RECETTE_MOT_DE_PASSE=… node navigateur.mjs <origine> <dossier construit> <rapport>');
  process.exit(2);
}

const PERMISES = new Set(['https://i.ytimg.com', 'https://www.youtube-nocookie.com', 'https://www.youtube.com', 'https://recette.luminose.fr']);

const pages = [];
const parcourir = (d) => {
  for (const n of readdirSync(d).sort()) {
    const c = join(d, n);
    if (statSync(c).isDirectory()) parcourir(c);
    else if (n.endsWith('.html')) pages.push(`/${relative(construit, c)}`);
  }
};
parcourir(construit);

const sorties = new Map();
const bloques = new Map();
const echecs = [];
let pageCourante = '';
let geste = 'chargement';

const origineDe = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return String(url).slice(0, 40);
  }
};
const noter = (table, cle) => {
  const e = table.get(cle) ?? { pages: new Set(), gestes: new Set() };
  e.pages.add(pageCourante);
  e.gestes.add(geste);
  table.set(cle, e);
};

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ serviceWorkers: 'block', httpCredentials: { username: 'recette', password: motDePasse } });

// L'interception, sur tout le contexte, avant le premier chargement.
await contexte.route('**/*', (route) => {
  const url = route.request().url();
  if (url.startsWith(origine) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
  const o = origineDe(url);
  noter(sorties, `${o} | ${route.request().resourceType()}`);
  if (!PERMISES.has(o)) echecs.push(`${pageCourante} (${geste}) : requête vers ${o} (${route.request().resourceType()})`);
  return route.abort();
});

// Les appels que la politique bloque, relevés dans la page.
await contexte.addInitScript(() => {
  document.addEventListener('securitypolicyviolation', (e) => {
    window.__bloques = window.__bloques || [];
    let o = '';
    try { o = new URL(e.blockedURI).origin; } catch { o = e.blockedURI; }
    window.__bloques.push(`${o} | ${e.effectiveDirective}`);
  });
});

contexte.on('page', (p) => {
  p.on('popup', (fenetre) => {
    const o = origineDe(fenetre.url() || 'about:blank');
    if (!fenetre.url().startsWith(origine) && fenetre.url() !== 'about:blank') echecs.push(`${pageCourante} (${geste}) : fenêtre ouverte vers ${o}`);
  });
});

for (const chemin of pages) {
  pageCourante = chemin;
  geste = 'chargement';
  const p = await contexte.newPage();
  p.setDefaultTimeout(4000);
  p.on('framenavigated', (f) => {
    const u = f.url();
    if (u.startsWith(origine) || u.startsWith('about:') || u.startsWith('data:') || u.startsWith('chrome-error:')) return;
    if (!PERMISES.has(origineDe(u))) echecs.push(`${chemin} (${geste}) : navigation vers ${origineDe(u)}`);
  });
  await p.goto(origine + chemin, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(600);

  geste = 'défilement';
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  }).catch(() => {});

  geste = 'rendez-vous';
  for (const sel of ['.bt-prise-rdv', '#bt-choix-nouveau-client', '[id^=bt-seance-]', 'lite-youtube']) {
    const l = p.locator(`${sel}:visible`);
    for (let i = 0; i < Math.min(await l.count().catch(() => 0), 3); i++) await l.nth(i).click({ timeout: 1500 }).catch(() => {});
  }
  await p.waitForTimeout(300);

  geste = 'liens coupés et paiement';
  const coupes = p.locator('[data-recette-lien-coupe]:visible, a[href*="payer"]:visible, button:has-text("Payer"):visible');
  for (let i = 0; i < Math.min(await coupes.count().catch(() => 0), 5); i++) await coupes.nth(i).click({ timeout: 1500 }).catch(() => {});
  await p.waitForTimeout(300);
  if (p.url().startsWith(origine) && new URL(p.url()).pathname !== new URL(origine + chemin).pathname && !p.url().includes('#')) {
    await p.goto(origine + chemin, { waitUntil: 'load' }).catch(() => {});
  }

  geste = 'formulaire';
  for (const f of await p.locator('form').all().catch(() => [])) {
    await f.evaluate((form) => {
      for (const el of form.querySelectorAll('input, textarea, select')) {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = true;
        else if (el.type === 'email') el.value = 'essai@example.org';
        else if (el.type === 'tel') el.value = '+33600000000';
        else if (el.type === 'date') el.value = '1990-01-01';
        else if (el.type === 'number') el.value = '1';
        else if (el.tagName === 'SELECT') el.selectedIndex = el.options.length - 1;
        else if (el.type !== 'hidden' && el.type !== 'submit') el.value = 'Essai';
      }
    }).catch(() => {});
    await f.locator('[type=submit], button:not([type=button])').first().click({ timeout: 1500 })
      .catch(() => f.evaluate((form) => form.requestSubmit?.()).catch(() => {}));
    await p.waitForTimeout(500);
  }

  for (const b of await p.evaluate(() => window.__bloques || []).catch(() => [])) {
    geste = 'page';
    noter(bloques, b);
  }
  const sw = await p.evaluate(async () => (navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 0)).catch(() => 0);
  if (sw > 0) echecs.push(`${chemin} : ${sw} service worker(s) enregistré(s)`);
  await p.close();
}
if (contexte.serviceWorkers().length > 0) echecs.push(`${contexte.serviceWorkers().length} service worker(s) actif(s)`);
await navigateur.close();

const ligne = ([cle, e]) => `  ${cle} — ${e.pages.size} page(s), gestes : ${[...e.gestes].join(', ')}`;
const texte = [
  `Essai en navigateur de ${origine} — ${pages.length} pages`,
  '',
  'Arrivées à l’interception (passées par la politique) :',
  ...[...sorties].sort().map(ligne),
  '',
  'Bloquées par la politique (ce qui aurait fui sans elle) :',
  ...[...bloques].sort().map(ligne),
  '',
  echecs.length ? `ÉCHECS (${echecs.length}) :` : 'Aucun échec : aucune requête vers un service, aucune fenêtre vers un service, aucun service worker.',
  ...[...new Set(echecs)].map((e) => `  ${e}`),
].join('\n');
writeFileSync(rapport, `${texte}\n`);
console.log(texte);
process.exit(echecs.length ? 1 : 0);
