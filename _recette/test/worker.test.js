/**
 * Les essais du Worker de recette, hors ligne.
 *
 * Le Worker tourne sous `wrangler dev`, avec la configuration livrée
 * (wrangler.jsonc, sans son domaine) et un petit site d'essai (test/site-essai/) :
 * le HTMLRewriter, WebCrypto et la résolution des fichiers par Cloudflare sont
 * les vrais. Les requêtes partent en HTTP brut vers 127.0.0.1, avec l'en-tête
 * Host voulu : `wrangler dev` le conserve, c'est ce qui permet d'éprouver le
 * contrôle de l'hôte.
 *
 * Aucune requête ne quitte la machine : le garde du réseau (garde-reseau.mjs)
 * est chargé dans wrangler et ses enfants, et le dernier essai vérifie que son
 * journal est vide. Le Worker, lui, n'appelle que ses fichiers — un essai le lit
 * dans le code.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, '..');
const travail = join(racine, '.wrangler', 'essais');
const JOURNAL = join(travail, 'reseau.log');
const MOT_DE_PASSE = 'essai-local-seulement';

/** La configuration livrée, sans son domaine, pointée sur le site d'essai. */
const configuration = async () => {
  const brut = await readFile(join(racine, 'wrangler.jsonc'), 'utf8');
  const config = JSON.parse(brut.replace(/^\s*\/\/.*$/gm, ''));
  delete config.routes;
  delete config.$schema;
  config.main = join(racine, config.main);
  config.assets.directory = join(ici, 'site-essai');
  const chemin = join(travail, 'wrangler.json');
  await writeFile(chemin, JSON.stringify(config, null, 2));
  return chemin;
};

const instances = [];

/** Une instance de `wrangler dev` sur `port`, avec ces variables ; résolue quand elle est prête. */
const lancer = (config, port, vars) =>
  new Promise((ok, ko) => {
    const args = ['dev', '--config', config, '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', String(port + 100), '--persist-to', join(travail, `etat-${port}`)];
    for (const [k, v] of Object.entries(vars)) args.push('--var', `${k}:${v}`);
    const enfant = spawn(join(racine, 'node_modules', '.bin', 'wrangler'), args, {
      cwd: travail,
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: 'false',
        CLOUDFLARE_CF_FETCH_ENABLED: 'false',
        NODE_OPTIONS: `--import ${join(ici, 'garde-reseau.mjs')}`,
        RECETTE_JOURNAL_RESEAU: JOURNAL,
        FORCE_COLOR: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    instances.push(enfant);
    let sortie = '';
    const lire = (d) => {
      sortie += d;
      if (sortie.includes('Ready on')) ok(port);
    };
    enfant.stdout.on('data', lire);
    enfant.stderr.on('data', lire);
    enfant.on('exit', (code) => ko(new Error(`wrangler dev (${port}) s'est arrêté (${code}) :\n${sortie}`)));
    setTimeout(() => ko(new Error(`wrangler dev (${port}) n'a pas démarré :\n${sortie}`)), 60_000);
  });

const OUVERTE = 8791;
const FERMEE = 8792;
const VIDE = 8793;
const DEUX_POINTS = 8794;

before(async () => {
  await rm(travail, { recursive: true, force: true });
  await mkdir(travail, { recursive: true });
  const config = await configuration();
  await Promise.all([
    lancer(config, OUVERTE, { RECETTE_MOT_DE_PASSE: MOT_DE_PASSE, RECETTE_BRANCHE: 'chantier/essai', RECETTE_COMMIT: 'abc1234' }),
    lancer(config, FERMEE, {}),
    lancer(config, VIDE, { RECETTE_MOT_DE_PASSE: '' }),
    lancer(config, DEUX_POINTS, { RECETTE_MOT_DE_PASSE: 'a:b:c' }),
  ]);
});
after(() => {
  for (const enfant of instances) enfant.kill('SIGTERM');
});

/** Une requête HTTP brute : l'en-tête Host est celui qu'on veut, et rien ne suit les redirections. */
const requete = (port, chemin, { hote = 'recette.luminose.fr', entetes = {}, methode = 'GET', corps } = {}) =>
  new Promise((ok, ko) => {
    const r = http.request({ host: '127.0.0.1', port, path: chemin, method: methode, headers: { Host: hote, ...entetes } }, (res) => {
      const morceaux = [];
      res.on('data', (m) => morceaux.push(m));
      res.on('end', () => {
        const texte = Buffer.concat(morceaux).toString('utf8');
        ok({ status: res.statusCode, headers: { get: (n) => res.headers[n.toLowerCase()] ?? null, tous: res.headers }, text: async () => texte, arrayBuffer: async () => null });
      });
    });
    r.on('error', ko);
    if (corps) r.write(corps);
    r.end();
  });

const basic = (id, mdp) => `Basic ${Buffer.from(`${id}:${mdp}`).toString('base64')}`;
const AVEC = { Authorization: basic('recette', MOT_DE_PASSE) };
const get = (chemin, { hote, entetes = AVEC, port = OUVERTE, methode } = {}) => requete(port, chemin, { hote, entetes, methode });

const sansFuite = async (r) => {
  const corps = await r.text();
  assert.ok(!corps.includes(MOT_DE_PASSE), 'le mot de passe ne paraît jamais dans une réponse');
  for (const v of Object.values(r.headers.tous)) assert.ok(!String(v).includes(MOT_DE_PASSE));
  return corps;
};

// ─── Fermée par défaut ──────────────────────────────────────────────────────

test('secret absent : tout répond 401, robots.txt compris', async () => {
  for (const chemin of ['/', '/page.html', '/robots.txt', '/style.css', '/n-existe-pas']) {
    const r = await get(chemin, { port: FERMEE });
    assert.equal(r.status, 401, chemin);
    assert.equal(await r.text(), 'Recette fermée : mot de passe non configuré.\n');
    assert.equal(r.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  }
});

test('secret vide : fermée aussi', async () => {
  const r = await get('/', { port: VIDE });
  assert.equal(r.status, 401);
  assert.match(await r.text(), /non configuré/);
});

test('sans mot de passe, mauvais mot de passe, mauvais identifiant : 401 et la demande', async () => {
  const cas = [{}, { Authorization: basic('recette', 'faux') }, { Authorization: basic('autre', MOT_DE_PASSE) },
    { Authorization: 'Basic %%%' }, { Authorization: `Bearer ${MOT_DE_PASSE}` }, { Authorization: basic('recette', '') }];
  for (const entetes of cas) {
    const r = await get('/page.html', { entetes });
    assert.equal(r.status, 401, JSON.stringify(entetes).slice(0, 40));
    assert.match(r.headers.get('WWW-Authenticate'), /^Basic realm=/);
    const corps = await sansFuite(r);
    assert.ok(!corps.includes('La page.'));
  }
});

test('le même fichier : 401 sans le mot de passe, 200 avec', async () => {
  assert.equal((await get('/style.css', { entetes: {} })).status, 401);
  const r = await get('/style.css');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'body { color: #613F7F; }\n');
});

test('un mot de passe contenant « : » passe', async () => {
  assert.equal((await get('/', { port: DEUX_POINTS, entetes: { Authorization: basic('recette', 'a:b:c') } })).status, 200);
  assert.equal((await get('/', { port: DEUX_POINTS, entetes: { Authorization: basic('recette', 'a:b') } })).status, 401);
});

// ─── L'hôte ─────────────────────────────────────────────────────────────────

test('un autre hôte : 404 vide, même avec le mot de passe', async () => {
  for (const hote of ['luminose-site-recette.florent.workers.dev', 'abc123-luminose-site-recette.florent.workers.dev', 'www.luminose.fr', 'recette.luminose.fr.evil.com']) {
    const r = await get('/', { hote });
    assert.equal(r.status, 404, hote);
    assert.equal(await r.text(), '');
    assert.equal(r.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  }
});

test('la machine locale est servie, pour les essais', async () => {
  assert.equal((await get('/', { hote: 'localhost:8790' })).status, 200);
  assert.equal((await get('/', { hote: '127.0.0.1:8790' })).status, 200);
});

// ─── Les adresses de GitHub Pages ───────────────────────────────────────────

const cas = [
  ['/', 200, 'Accueil'],
  ['/dossier/', 200, 'Le dossier.'],
  ['/page.html', 200, 'La page.'],
  ['/page', 200, 'La page.'],
  ['/blog/article', 200, 'Article.'],
  ['/blog/article.html', 200, 'Article.'],
  ['/page/', 404, 'Page introuvable.'],
  ['/page.html/', 404, 'Page introuvable.'],
  ['/blog/', 404, 'Page introuvable.'],
  ['/n-existe-pas', 404, 'Page introuvable.'],
  ['/n-existe-pas.html', 404, 'Page introuvable.'],
  ['/style.css/', 404, 'Page introuvable.'],
  ['/index', 200, 'Accueil'],
  ['/../page.html', 200, 'La page.'], // l'URL normalise déjà « .. »
  ['/a%2f..%2fpage.html', 404, 'Page introuvable.'],
];

for (const [chemin, statut, contenu] of cas) {
  test(`adresse ${chemin} → ${statut}`, async () => {
    const r = await get(chemin);
    assert.equal(r.status, statut);
    assert.equal(r.headers.get('Location'), null);
    assert.ok((await r.text()).includes(contenu));
  });
}

test('/dossier → redirection vers /dossier/, la requête gardée', async () => {
  const r = await get('/dossier?x=1');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('Location'), '/dossier/?x=1');
  assert.equal(r.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('HEAD répond comme GET, sans corps', async () => {
  const r = await get('/page', { methode: 'HEAD' });
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '');
});

test('une autre méthode : 405', async () => {
  const r = await requete(OUVERTE, '/page', { methode: 'POST', entetes: { ...AVEC, 'Content-Length': '1' }, corps: 'x' });
  assert.equal(r.status, 405);
});

// ─── Les en-têtes ───────────────────────────────────────────────────────────

test('les en-têtes, sur toute réponse : 200, 404, 301, 401', async () => {
  for (const [chemin, entetes] of [['/', AVEC], ['/n-existe-pas', AVEC], ['/dossier', AVEC], ['/', {}], ['/style.css', AVEC]]) {
    const r = await get(chemin, { entetes });
    assert.equal(r.headers.get('X-Robots-Tag'), 'noindex, nofollow', chemin);
    assert.equal(r.headers.get('Cache-Control'), 'no-store', chemin);
    assert.ok(r.headers.get('Content-Security-Policy')?.startsWith("default-src 'none'"), chemin);
    assert.equal(r.headers.get('ETag'), null);
    await r.arrayBuffer();
  }
});

test('la politique : chaque origine dans sa seule directive', async () => {
  const csp = (await get('/')).headers.get('Content-Security-Policy');
  const d = Object.fromEntries(csp.split('; ').map((x) => { const [k, ...v] = x.split(' '); return [k, v]; }));
  assert.deepEqual(d['default-src'], ["'none'"]);
  assert.deepEqual(d['connect-src'], ["'self'", 'https://api-recette.luminose.fr']);
  assert.deepEqual(d['form-action'], ["'self'", 'https://api-recette.luminose.fr']);
  assert.deepEqual(d['img-src'], ["'self'", 'data:', 'https://i.ytimg.com']);
  assert.deepEqual(d['frame-src'], ['https://www.youtube-nocookie.com', 'https://www.youtube.com']);
  assert.deepEqual(d['script-src'], ["'self'", "'unsafe-inline'", 'https://www.youtube.com']);
  assert.deepEqual(d['style-src'], ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(d['worker-src'], ["'none'"]);
  assert.deepEqual(d['object-src'], ["'none'"]);
  assert.deepEqual(d['base-uri'], ["'self'"]);
  // Aucun service, nulle part.
  for (const service of ['calendly', 'stripe', 'stancer', 'make.com', 'sibforms', 'brevo', 'google.com', 'googletagmanager', 'doubleclick', 'mixpanel', 'mxpnl', 'fonts.net', 'unsafe-eval', '*']) {
    assert.ok(!csp.includes(service), service);
  }
});

// ─── robots.txt et sitemap ──────────────────────────────────────────────────

test('robots.txt interdit tout ; celui du site est ignoré', async () => {
  const r = await get('/robots.txt');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'User-agent: *\nDisallow: /\n');
});

test('sitemap.xml : 404, même si le site en a un', async () => {
  const r = await get('/sitemap.xml');
  assert.equal(r.status, 404);
  assert.ok(!(await r.text()).includes('urlset'));
});

// ─── La réécriture ──────────────────────────────────────────────────────────

test('la page : balise robots, marque, branche et commit', async () => {
  const html = await sansFuite(await get('/'));
  assert.match(html, /<head><meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /id="luminose-recette"/);
  assert.match(html, /chantier\/essai · abc1234/);
  assert.match(html, /securitypolicyviolation/);
  assert.match(html, /window\.open = function/);
  // La pastille ne prend pas les clics hors d'elle-même.
  assert.match(html, /id="luminose-recette" role="status" style="position:fixed;[^"]*pointer-events:none/);
});

test('la page 404 est réécrite aussi', async () => {
  const html = await (await get('/n-existe-pas')).text();
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /id="luminose-recette"/);
});

test('les liens vers un service deviennent inertes ; les autres restent', async () => {
  const html = await (await get('/')).text();
  assert.match(html, /<a id="calendly" href="#recette-lien-coupe" data-recette-lien-coupe="calendly.com" title="Lien coupé en recette \(calendly.com\)">/);
  assert.match(html, /<a id="stancer" href="#recette-lien-coupe" data-recette-lien-coupe="payment.stancer.com"/);
  assert.ok(!html.includes('calendly.com/luminose'));
  assert.ok(!html.includes('payment.stancer.com/xyz'));
  assert.match(html, /<a id="interne" href="\/page">/);
  assert.match(html, /<a id="social" href="https:\/\/www.facebook.com\/luminose">/);
  assert.match(html, /<a id="illisible" href="http:\/\/\[">/);
});

test('les chargements anticipés hors liste sont retirés ; les autorisés restent', async () => {
  const html = await (await get('/')).text();
  assert.ok(!html.includes('assets.calendly.com'));
  assert.ok(!html.includes('googletagmanager'));
  assert.match(html, /<link rel="preconnect" href="https:\/\/i.ytimg.com">/);
  assert.match(html, /<link rel="stylesheet" href="\/style.css">/);
});

test('une redirection meta vers une autre origine est retirée ; une interne reste', async () => {
  assert.ok(!(await (await get('/redirection')).text()).includes('http-equiv'));
  assert.match(await (await get('/redirection-interne')).text(), /http-equiv="refresh" content="0; url=\/page"/);
});

test('ce qui n’est pas du HTML passe tel quel', async () => {
  const r = await get('/style.css');
  assert.equal(await r.text(), 'body { color: #613F7F; }\n');
  assert.match(r.headers.get('Content-Type'), /^text\/css/);
});

test('le Worker n’appelle que ses fichiers', async () => {
  const code = await readFile(join(racine, 'src', 'index.js'), 'utf8');
  const appels = code.match(/\bfetch\s*\(/g) ?? [];
  const fichiers = code.match(/env\.ASSETS\.fetch\s*\(/g) ?? [];
  assert.equal(appels.length, fichiers.length + 1, 'un seul autre « fetch( » : le gestionnaire du Worker');
  assert.match(code, /async fetch\(requete, env\)/);
  assert.ok(!/connect\(|WebSocket|sendBeacon/.test(code));
});

test('aucune requête n’a quitté la machine pendant les essais', async () => {
  const journal = existsSync(JOURNAL) ? await readFile(JOURNAL, 'utf8') : '';
  assert.equal(journal, '', `connexions refusées par le garde :\n${journal}`);
});
