#!/usr/bin/env node
/**
 * Comparer deux sites construits, page par page, pixel par pixel.
 *
 *   node comparer.mjs --avant <_site d'avant> --apres <_site d'après> --sortie <dossier hors git> [--pages motif] [--paralleles 4]
 *
 * Pour chaque page HTML : une photo pleine hauteur à 390 px et à 1280 px, en thème
 * clair et en thème sombre par le réglage du système, et en thème sombre par
 * l'attribut `data-theme="dark"` que les feuilles connaissent (le site n'a pas de
 * bascule : l'attribut la remplace). Puis les états que le site sait prendre — menu,
 * bandeau de cookies, fenêtre de rendez-vous et ses étapes, formulaire en erreur,
 * onglets, image agrandie, survol et focus — rejoués des deux côtés à l'identique.
 *
 * Rendu stable : animations et transitions neutralisées, images à chargement
 * différé forcées, tout appel hors du serveur local bloqué (polices distantes,
 * Calendly, Tag Manager, YouTube), le choix de cookies fixé.
 *
 * Aucune capture ni rapport dans un dépôt : la sortie est refusée si elle est dans
 * un arbre git. Le rapport (rapport.md, et une image de chaque écart) y est écrit.
 */
import http from 'node:http';
import { createReadStream, existsSync, mkdirSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// ─── Les arguments ──────────────────────────────────────────────────────────

const arg = (nom, defaut) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i >= 0 ? process.argv[i + 1] : defaut;
};
const AVANT = resolve(arg('avant', ''));
const APRES = resolve(arg('apres', ''));
const SORTIE = resolve(arg('sortie', ''));
const FILTRE = arg('pages', null);
const PARALLELES = Number(arg('paralleles', '4'));
const SANS_ETATS = process.argv.includes('--sans-etats');
if (!existsSync(AVANT) || !existsSync(APRES) || !arg('sortie')) {
  console.error('Usage : node comparer.mjs --avant <site> --apres <site> --sortie <dossier hors git>');
  process.exit(2);
}

/** La sortie n'est jamais dans un arbre git : les captures et le rapport ne doivent pas finir dans le dépôt. */
const dansUnArbreGit = (chemin) => {
  let c = chemin;
  while (!existsSync(c)) c = dirname(c);
  c = realpathSync(c);
  for (;;) {
    if (existsSync(join(c, '.git'))) return c;
    const p = dirname(c);
    if (p === c) return null;
    c = p;
  }
};
if (dansUnArbreGit(SORTIE)) {
  console.error(`Refusé : la sortie ${SORTIE} est dans un arbre git. Choisir un dossier hors de tout dépôt.`);
  process.exit(2);
}
mkdirSync(join(SORTIE, 'ecarts'), { recursive: true });

// ─── Deux serveurs locaux ───────────────────────────────────────────────────

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.pdf': 'application/pdf',
};

const servir = (racine) => new Promise((ok) => {
  const serveur = http.createServer((req, res) => {
    let chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let fichier = join(racine, chemin);
    if (existsSync(fichier) && statSync(fichier).isDirectory()) fichier = join(fichier, 'index.html');
    else if (!existsSync(fichier) && existsSync(`${fichier}.html`)) fichier = `${fichier}.html`;
    if (!fichier.startsWith(racine) || !existsSync(fichier)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(fichier).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    createReadStream(fichier).pipe(res);
  });
  serveur.listen(0, '127.0.0.1', () => ok({ serveur, origine: `http://127.0.0.1:${serveur.address().port}` }));
});

// ─── Les pages ──────────────────────────────────────────────────────────────

const pagesDe = (racine) => {
  const toutes = [];
  const parcourir = (d) => {
    for (const nom of readdirSync(d)) {
      const c = join(d, nom);
      if (statSync(c).isDirectory()) parcourir(c);
      else if (nom.endsWith('.html')) toutes.push(`/${relative(racine, c).split('\\').join('/')}`);
    }
  };
  parcourir(racine);
  return toutes;
};

const PAGES = [...new Set([...pagesDe(AVANT), ...pagesDe(APRES)])].sort().filter((p) => !FILTRE || p.includes(FILTRE));

const LARGEURS = [390, 1280];
/** Trois thèmes : le réglage du système, clair et sombre ; et l'attribut que les feuilles connaissent. */
const THEMES = [
  { nom: 'clair', schema: 'light', attribut: false },
  { nom: 'sombre', schema: 'dark', attribut: false },
  { nom: 'sombre-attribut', schema: 'light', attribut: true },
];

// ─── Le rendu stable ────────────────────────────────────────────────────────

const STABILISER = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }
`;

const contexte = async (navigateur, origine, largeur, theme, avecCookie) => {
  const ctx = await navigateur.newContext({
    viewport: { width: largeur, height: 900 }, deviceScaleFactor: 1, colorScheme: theme.schema, reducedMotion: 'reduce',
    locale: 'fr-FR', timezoneId: 'Europe/Paris', isMobile: false, hasTouch: false,
  });
  // Tout ce qui n'est pas le serveur local est bloqué, des deux côtés à l'identique.
  await ctx.route('**/*', (route) => (route.request().url().startsWith(origine) || route.request().url().startsWith('data:') ? route.continue() : route.abort()));
  if (avecCookie) await ctx.addCookies([{ name: 'luminose_consentement', value: 'refuse', url: origine }]);
  await ctx.addInitScript(({ css, attribut }) => {
    // Les dates et l'aléatoire sont figés : deux constructions doivent donner deux pages identiques.
    const fixe = new Date('2026-11-27T10:00:00Z').getTime();
    const D = Date;
    // eslint-disable-next-line no-global-assign
    Date = class extends D { constructor(...a) { super(...(a.length ? a : [fixe])); } static now() { return fixe; } };
    let graine = 42;
    Math.random = () => { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; };
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
      if (attribut) document.documentElement.setAttribute('data-theme', 'dark');
    });
  }, { css: STABILISER, attribut: theme.attribut });
  return ctx;
};

/** Charge une page, force les images différées, attend qu'elles soient là. */
const charger = async (page, url) => {
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 }).catch(() => {});
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img')) { img.loading = 'eager'; img.decoding = 'sync'; }
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 5000); }))));
    await document.fonts.ready;
    window.scrollTo(0, 0);
  }).catch(() => {});
  await page.waitForTimeout(150);
};

// ─── Les états ──────────────────────────────────────────────────────────────

/**
 * Chaque état : comment savoir s'il existe sur la page, et comment le rejouer.
 * `parGabarit` : l'état vient du gabarit, il se rejoue sur une page par gabarit.
 * Ceux qui demandent le réseau (la fenêtre Calendly chargée) ne sont pas rejouables.
 */
const ETATS = [
  { nom: 'menu-ouvert', largeurs: [390], parGabarit: true, existe: '#bt-navigation', jouer: (p) => p.click('#bt-navigation') },
  { nom: 'bandeau-cookies', parGabarit: true, zone: 'fenetre', sansCookie: true, existe: '#md-cookies', jouer: async () => {} },
  { nom: 'rdv-accueil', parGabarit: true, zone: 'fenetre', existe: '.bt-prise-rdv', jouer: (p) => p.locator('.bt-prise-rdv').first().click() },
  { nom: 'rdv-nouveau-client', parGabarit: true, zone: 'fenetre', existe: '.bt-prise-rdv', jouer: async (p) => { await p.locator('.bt-prise-rdv').first().click(); await p.click('#bt-choix-nouveau-client'); } },
  { nom: 'rdv-deja-client', parGabarit: true, zone: 'fenetre', existe: '.bt-prise-rdv', jouer: async (p) => { await p.locator('.bt-prise-rdv').first().click(); await p.click('#bt-choix-deja-client'); } },
  { nom: 'rdv-seance-adulte', parGabarit: true, zone: 'fenetre', existe: '.bt-prise-rdv', jouer: async (p) => { await p.locator('.bt-prise-rdv').first().click(); await p.click('#bt-choix-deja-client'); await p.click('#bt-choix-lieu-adulte'); } },
  // Sans envoyer : la bulle de validation du navigateur n'est pas du CSS, et son apparition n'est pas stable.
  // Une saisie invalide puis la sortie du champ : la validation du site, et :user-invalid, prennent la main.
  { nom: 'formulaire-en-erreur', existe: 'form input[type=email], form input[required]', jouer: async (p) => {
    const champ = p.locator('form input[type=email]:visible, form input[required]:visible').first();
    await champ.fill('x');
    await champ.blur();
    await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
  } },
  { nom: 'onglets', existe: '#hypnotherapy-tabs .tabs a', jouer: (p) => p.locator('#hypnotherapy-tabs .tabs a').last().click() },
  { nom: 'details-ouverts', existe: 'details', jouer: (p) => p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; })) },
  { nom: 'image-agrandie', existe: 'img[data-action=zoom]', jouer: (p) => p.locator('img[data-action=zoom]').first().click() },
  { nom: 'survol-bouton', parGabarit: true, existe: '.button', zone: 'element', jouer: async (p) => { const b = p.locator('.button:visible').first(); await b.evaluate((e) => e.scrollIntoView({ block: 'center' })); await b.hover(); } },
  { nom: 'focus-bouton', parGabarit: true, existe: '.button', zone: 'element', jouer: (p) => p.evaluate(() => { const b = [...document.querySelectorAll('.button')].find((x) => x.offsetParent); b?.scrollIntoView({ block: 'center' }); b?.focus({ focusVisible: true }); }) },
  { nom: 'survol-lien', parGabarit: true, existe: 'a', zone: 'element', jouer: async (p) => { const a = p.locator('main a:visible, .content a:visible').first(); await a.evaluate((e) => e.scrollIntoView({ block: 'center' })); await a.hover(); } },
  { nom: 'focus-lien', parGabarit: true, existe: 'a', zone: 'element', jouer: (p) => p.evaluate(() => { const a = [...document.querySelectorAll('main a, .content a')].find((x) => x.offsetParent); a?.scrollIntoView({ block: 'center' }); a?.focus({ focusVisible: true }); }) },
];
export const ETATS_NON_REJOUABLES = [
  'la fenêtre Calendly chargée (elle demande le réseau de Calendly)',
  'le paiement d’un stage et d’une séance (ils demandent Stripe et les webhooks)',
  'les messages de réussite d’un formulaire (ils demandent un envoi réel)',
  'le lecteur de breathwork en cours de lecture (il demande l’audio et le temps qui passe)',
  'une vidéo YouTube lancée (elle demande youtube-nocookie.com)',
];

// ─── La comparaison ─────────────────────────────────────────────────────────

const comparerImages = (a, b) => {
  const pa = PNG.sync.read(a);
  const pb = PNG.sync.read(b);
  if (pa.width !== pb.width || pa.height !== pb.height) {
    return { ecart: Infinity, raison: `tailles différentes : ${pa.width}×${pa.height} contre ${pb.width}×${pb.height}`, image: a };
  }
  const diff = new PNG({ width: pa.width, height: pa.height });
  const n = pixelmatch(pa.data, pb.data, diff.data, pa.width, pa.height, { threshold: 0, includeAA: true });
  return { ecart: n, image: n ? PNG.sync.write(diff) : null };
};

const nomDeFichier = (s) => s.replace(/^\//, '').replace(/[^a-zA-Z0-9.-]+/g, '_');

const main = async () => {
  const [sa, sb] = await Promise.all([servir(AVANT), servir(APRES)]);
  // Un rendu déterministe : pas de rastérisation partielle ni de GPU, une seule gamme de couleurs,
  // pas de lissage sous-pixel. Sans eux, deux rendus de la même page diffèrent de quelques pixels.
  const ARGUMENTS = ['--disable-gpu', '--disable-gpu-rasterization', '--disable-partial-raster', '--force-color-profile=srgb',
    '--disable-lcd-text', '--font-render-hinting=none', '--disable-skia-runtime-opts'];
  const navigateur = await chromium.launch({ args: ARGUMENTS, ...(existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}) });
  const resultats = [];
  const rejoues = new Map();
  const gabaritsVus = new Map();
  const taches = [];

  for (const largeur of LARGEURS) {
    for (const theme of THEMES) {
      for (const chemin of PAGES) taches.push({ largeur, theme, chemin, etat: null });
    }
  }

  /**
   * Un écart se confirme : la paire est rechargée et rephotographiée, jusqu'à trois fois.
   * Une différence due au CSS revient à chaque fois ; un pixel de rastérisation, non.
   */
  const photographier = async (ctxA, ctxB, t) => {
    for (let essai = 1; ; essai++) {
      const r = await unePaire(ctxA, ctxB, t, essai === 1);
      if (!r.ecart || essai === 3) {
        // Un écart qui ne s'est pas confirmé ne laisse pas d'image derrière lui.
        if (!r.ecart && essai > 1) rmSync(join(SORTIE, 'ecarts', `${nomDeFichier(t.chemin)}__${t.largeur}__${t.theme.nom}${t.etat ? `__${t.etat.nom}` : ''}.png`), { force: true });
        resultats.push(r.ligne);
        return;
      }
    }
  };

  const unePaire = async (ctxA, ctxB, t, premiere) => {
    const [pa, pb] = await Promise.all([ctxA.newPage(), ctxB.newPage()]);
    for (const p of [pa, pb]) p.setDefaultTimeout(5000);
    try {
      await Promise.all([charger(pa, sa.origine + t.chemin), charger(pb, sb.origine + t.chemin)]);
      if (t.etat) {
        for (const p of [pa, pb]) {
          await t.etat.jouer(p).catch(() => {});
          await p.waitForTimeout(300);
        }
      }
      /**
       * La zone d'un état, mesurée sur CHAQUE page : l'élément survolé ou qui a le focus
       * (avec la marge de son contour), ou la fenêtre ouverte. Le fond d'une fenêtre est déjà
       * comparé page par page ; un survol peut faire défiler la page, chacune à son rythme.
       */
      const zoneDe = (p) => p.evaluate(({ zone, largeur }) => {
        let el = null;
        // Une liste de sélecteurs rend le premier élément du document : la fenêtre entière passerait avant sa carte.
        if (zone === 'fenetre') el = document.querySelector('.modal.is-active .modal-card') ?? document.querySelector('.modal.is-active .modal-content') ?? document.querySelector('.modal.is-active');
        else if (zone) el = document.activeElement && document.activeElement !== document.body ? document.activeElement : [...document.querySelectorAll(':hover')].pop();
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const x = Math.max(Math.floor(r.x) - 24, 0);
        const y = Math.max(Math.floor(r.y) - 24, 0);
        const b = { x, y, width: Math.min(Math.ceil(r.width) + 48, largeur - x), height: Math.min(Math.ceil(r.height) + 48, window.innerHeight - y) };
        return b.width > 0 && b.height > 0 ? b : null;
      }, { zone: t.etat?.zone ?? null, largeur: t.largeur });
      const optionsDe = async (p) => {
        if (!t.etat) return { fullPage: true, timeout: 120_000 };
        const zone = t.etat.zone ? await zoneDe(p) : null;
        return zone ? { clip: zone, timeout: 60_000 } : { timeout: 60_000 };
      };
      // Une photo n'est retenue que lorsque la page ne bouge plus : deux photos de suite identiques.
      const stable = async (p) => {
        const options = await optionsDe(p);
        let precedente = await p.screenshot(options);
        for (let i = 0; i < 6; i++) {
          await p.waitForTimeout(200);
          const courante = await p.screenshot(options);
          if (courante.equals(precedente)) return courante;
          precedente = courante;
        }
        return precedente;
      };
      const [ia, ib] = await Promise.all([stable(pa), stable(pb)]);
      const r = comparerImages(ia, ib);
      const libelle = `${t.chemin} · ${t.largeur} px · ${t.theme.nom}${t.etat ? ` · ${t.etat.nom}` : ''}`;
      let ligne = { libelle, ecart: 0 };
      if (r.ecart) {
        const nom = `${nomDeFichier(t.chemin)}__${t.largeur}__${t.theme.nom}${t.etat ? `__${t.etat.nom}` : ''}.png`;
        writeFileSync(join(SORTIE, 'ecarts', nom), r.image);
        ligne = { libelle, ecart: r.ecart, raison: r.raison, image: `ecarts/${nom}` };
      }
      // Les états qui existent sur cette page, pour la passe suivante.
      if (premiere && !t.etat && !SANS_ETATS) {
        const signature = await pa.evaluate(() => `${document.body.className}|${!!document.getElementById('main-navbar')}|${!!document.getElementById('md-prise-rdv')}|${!!document.getElementById('md-cookies')}`);
        for (const etat of ETATS) {
          if (etat.largeurs && !etat.largeurs.includes(t.largeur)) continue;
          if (t.theme.attribut) continue;
          if (!(await pa.$(etat.existe))) continue;
          const cle = `${etat.nom}|${t.largeur}|${t.theme.nom}`;
          if (etat.parGabarit) {
            const vus = gabaritsVus.get(cle) ?? new Set();
            if (vus.has(signature)) continue;
            vus.add(signature);
            gabaritsVus.set(cle, vus);
          }
          taches.push({ largeur: t.largeur, theme: t.theme, chemin: t.chemin, etat });
          rejoues.set(etat.nom, (rejoues.get(etat.nom) ?? 0) + 1);
        }
      }
      return { ecart: r.ecart, ligne };
    } finally {
      await Promise.all([pa.close(), pb.close()]);
    }
  };

  const contextes = new Map();
  const ctxPour = async (t) => {
    const cle = `${t.largeur}|${t.theme.nom}|${t.etat?.sansCookie ? 'sans' : 'avec'}`;
    if (!contextes.has(cle)) {
      contextes.set(cle, Promise.all([
        contexte(navigateur, sa.origine, t.largeur, t.theme, !t.etat?.sansCookie),
        contexte(navigateur, sb.origine, t.largeur, t.theme, !t.etat?.sansCookie),
      ]));
    }
    return contextes.get(cle);
  };

  let faites = 0;
  const ouvrier = async () => {
    for (;;) {
      const t = taches.shift();
      if (!t) return;
      const [ca, cb] = await ctxPour(t);
      await photographier(ca, cb, t).catch((e) => resultats.push({ libelle: `${t.chemin} · ${t.largeur} px · ${t.theme.nom}${t.etat ? ` · ${t.etat.nom}` : ''}`, ecart: Infinity, raison: `échec : ${e.message.split('\n')[0]}` }));
      faites++;
      if (faites % 50 === 0) console.log(`${faites} captures comparées…`);
    }
  };
  // Les pages d'abord ; les états s'ajoutent à la file au fil de l'eau.
  await Promise.all(Array.from({ length: PARALLELES }, ouvrier));
  while (taches.length) await Promise.all(Array.from({ length: PARALLELES }, ouvrier));

  await navigateur.close();
  sa.serveur.close();
  sb.serveur.close();

  const ecarts = resultats.filter((r) => r.ecart);
  const rapport = [
    '# Comparaison des pages',
    '',
    `Avant : \`${AVANT}\` — après : \`${APRES}\``,
    `${PAGES.length} pages, ${resultats.length} captures comparées, **${ecarts.length} écart(s)**.`,
    '',
    '## Écarts',
    ecarts.length ? ecarts.map((e) => `- ${e.libelle} — ${e.raison ?? `${e.ecart} pixels`}${e.image ? ` ([image](${e.image}))` : ''}`).join('\n') : '(aucun)',
    '',
    '## États rejoués',
    ...[...rejoues].map(([n, k]) => `- ${n} : ${k} capture(s)`),
    '',
    '## États qui n’ont pas pu être rejoués',
    ...ETATS_NON_REJOUABLES.map((e) => `- ${e}`),
    '',
    '## Pages identiques',
    [...new Set(resultats.filter((r) => !r.ecart).map((r) => r.libelle.split(' · ')[0]))].filter((p) => !ecarts.some((e) => e.libelle.startsWith(`${p} ·`))).map((p) => `- ${p}`).join('\n'),
    '',
  ].join('\n');
  writeFileSync(join(SORTIE, 'rapport.md'), rapport);
  writeFileSync(join(SORTIE, 'resultats.json'), JSON.stringify(resultats, null, 1));
  console.log(`${resultats.length} captures, ${ecarts.length} écart(s). Rapport : ${join(SORTIE, 'rapport.md')}`);
  process.exitCode = ecarts.length ? 1 : 0;
};

main().catch((e) => { console.error(e); process.exit(2); });
