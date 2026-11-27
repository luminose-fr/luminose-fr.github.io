#!/usr/bin/env node
/**
 * Alléger les feuilles publiées, puis contrôler — après `jekyll build`.
 *
 *   node scripts/alleger/alleger.mjs <dossier du site construit>
 *
 * 1. Le retrait : des deux feuilles (css/critical.css, css/main.css), les règles
 *    dont aucun sélecteur ne correspond à ce que le site contient — tout le HTML
 *    construit, et tous les scripts de js/ — sont retirées. Les variables CSS, les
 *    @font-face et les @keyframes restent tels quels. La liste de sauvegarde
 *    (sauvegarde.mjs) garde ce qu'aucun fichier n'écrit en clair.
 *
 * 2. Le contrôle, sans navigateur : une classe présente dans le HTML construit,
 *    dans js/, dans un nom de classe composé par un script, ou dans la liste de
 *    sauvegarde, qui avait une règle dans la feuille complète et n'en a plus dans
 *    la feuille allégée, fait échouer la construction — donc la publication. Le
 *    message nomme la classe et dit quoi faire.
 *
 * Les sources Sass ne sont pas touchées : seules les feuilles du site construit
 * changent. `./run.sh` sert toujours les feuilles complètes.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PurgeCSS } from 'purgecss';
import postcss from 'postcss';
import { CLASSES, MOTIFS, SANS_USAGE } from './sauvegarde.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEPOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const FEUILLES = ['css/critical.css', 'css/main.css'];

const fichiers = (dossier, extension) => {
  const trouves = [];
  const parcourir = (d) => {
    for (const nom of readdirSync(d)) {
      const c = join(d, nom);
      if (statSync(c).isDirectory()) parcourir(c);
      else if (nom.endsWith(extension)) trouves.push(c);
    }
  };
  parcourir(dossier);
  return trouves;
};

/** Le contenu que le site porte : le HTML construit, et les scripts (copiés de js/ dans le site). */
const contenus = (site) => [...fichiers(site, '.html'), ...fichiers(join(site, 'js'), '.js')];

/**
 * Les classes que le contenu POSE : les attributs `class` du HTML, et les chaînes
 * des scripts (js/ et les <script> des pages) — `classList.add('is-active')`,
 * `className = "zoom-overlay"`. Plus étroit que le découpage de PurgeCSS, qui
 * prend tout mot du texte : « année » dans une phrase n'est pas la classe .annee.
 */
export const classesPosees = (html, js) => {
  const poses = new Set();
  const ajouter = (chaine) => { for (const m of chaine.match(/[A-Za-z0-9_-]+/g) ?? []) poses.add(m); };
  const chaines = (code) => { for (const m of code.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) ajouter(m[2]); };
  for (const m of html.matchAll(/\bclass\s*=\s*(["'])([^"']*)\1/g)) ajouter(m[2]);
  // Le texte des pages n'en est pas : une apostrophe française ouvrirait une « chaîne ».
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) chaines(m[1]);
  chaines(js);
  return poses;
};

/**
 * Les noms de classes composés par un script : `"speed" + x + "sec"`, ou
 * `` `speed${x}sec` ``. Rendus en motifs : toute classe de la feuille complète qui
 * y répond est présumée posée par le script.
 */
export const classesComposees = (texte) => {
  const motifs = [];
  const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const m of texte.matchAll(/["']([A-Za-z][\w-]*)["']\s*\+\s*[\w.$]+(?:\s*\+\s*["']([\w-]*)["'])?/g)) {
    if (m[1].length >= 3) motifs.push(new RegExp(`^${echapper(m[1])}[\\w-]+${echapper(m[2] ?? '')}$`));
  }
  for (const m of texte.matchAll(/`([A-Za-z][\w-]*)\$\{[^}]+\}([\w-]*)`/g)) {
    if (m[1].length >= 3) motifs.push(new RegExp(`^${echapper(m[1])}[\\w-]+${echapper(m[2])}$`));
  }
  return motifs;
};

/** Pour chaque classe d'une feuille, le nombre de règles dont un sélecteur la nomme. */
export const reglesParClasse = (css) => {
  const compte = new Map();
  postcss.parse(css).walkRules((regle) => {
    // Une règle dans des @keyframes n'a pas de sélecteur de classe.
    if (regle.parent?.type === 'atrule' && /keyframes/i.test(regle.parent.name)) return;
    for (const m of regle.selector.matchAll(/\.((?:\\.|[\w-])+)/g)) {
      const classe = m[1].replace(/\\(.)/g, '$1');
      compte.set(classe, (compte.get(classe) ?? 0) + 1);
    }
  });
  return compte;
};

/**
 * Les classes que les feuilles PROPRES au site stylent (`_sass/ui-*.scss`, hors
 * Bulma et Font Awesome) : celles-là, quelqu'un les a écrites pour un usage.
 * Les adresses et les chaînes sont retirées d'abord (« font.eot » n'est pas une classe).
 */
export const classesDuSite = (sources) => new Set(
  [...sources.replace(/\/\/[^\n]*/g, '').replace(/url\([^)]*\)/g, '').replace(/(["'])(?:\\.|(?!\1).)*\1/g, '')
    .matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));

/**
 * Le contrôle. `complete` et `allegee` : le texte des deux feuilles ; `texte` : le
 * contenu du site, `{ html, js }` ; `stylees` : les classes des feuilles propres au site. Rend les
 * classes perdues, chacune avec ce qu'il faut faire.
 *
 * Une classe perdue l'est à tort si elle est présente dans le HTML construit ou
 * dans js/, composée par un script, dans la liste de sauvegarde — ou si les
 * feuilles du site la stylent sans qu'elle soit déclarée sans usage
 * (`SANS_USAGE`). C'est ce dernier cas qui fait échouer la construction quand on
 * retire de la liste de sauvegarde une classe posée par un outil extérieur.
 */
export const controler = (complete, allegee, { html, js }, classesSauvees = CLASSES, stylees = new Set(), sansUsage = SANS_USAGE) => {
  const avant = reglesParClasse(complete);
  const apres = reglesParClasse(allegee);
  const presents = classesPosees(html, js);
  const composees = classesComposees(`${js}\n${html}`);
  const perdues = [];
  for (const [classe, n] of avant) {
    if (n === 0 || (apres.get(classe) ?? 0) > 0) continue;
    const pourquoi = presents.has(classe) ? 'présente dans le HTML construit ou dans js/'
      : classesSauvees.includes(classe) ? 'dans la liste de sauvegarde'
        : composees.some((m) => m.test(classe)) ? 'composée par un script (js/)'
          : stylees.has(classe) && !sansUsage.includes(classe) ? 'stylée par _sass/ui-*.scss, et ni employée, ni déclarée sans usage' : null;
    if (pourquoi) perdues.push({ classe, pourquoi });
  }
  return perdues;
};

export const messageDeControle = (feuille, perdues) => [
  `Feuille allégée ${feuille} : ${perdues.length} classe(s) utilisée(s) ont perdu toutes leurs règles.`,
  ...perdues.map((p) => `  .${p.classe} — ${p.pourquoi}`),
  'Que faire, dans scripts/alleger/sauvegarde.mjs : si la classe est composée par un script ou posée',
  'par un outil extérieur, l’ajouter à CLASSES ou MOTIFS, avec sa raison ; si plus aucune page ne',
  'l’emploie, l’ajouter à SANS_USAGE. La publication est arrêtée.',
].join('\n');

export const alleger = async (site, { classes = CLASSES, motifs = MOTIFS, sansUsage = SANS_USAGE } = {}) => {
  const chemins = contenus(site);
  const lire = (extension) => chemins.filter((c) => c.endsWith(extension)).map((c) => readFileSync(c, 'utf8')).join('\n');
  const texte = { html: lire('.html'), js: lire('.js') };
  const stylees = classesDuSite(readdirSync(join(DEPOT, '_sass')).filter((n) => /^ui-.*\.scss$/.test(n))
    .map((n) => readFileSync(join(DEPOT, '_sass', n), 'utf8')).join('\n'));
  const bilans = [];
  const echecs = [];
  const ecritures = [];
  for (const feuille of FEUILLES) {
    const chemin = join(site, feuille);
    const complete = readFileSync(chemin, 'utf8');
    const [resultat] = await new PurgeCSS().purge({
      content: chemins,
      css: [{ raw: complete }],
      // Gardés tels quels : on ne retire que des règles.
      fontFace: false,
      keyframes: false,
      variables: false,
      safelist: {
        standard: [...classes, ...motifs.filter((m) => m.source.startsWith('^'))],
        greedy: motifs.filter((m) => !m.source.startsWith('^')),
      },
    });
    const allegee = resultat.css;
    const perdues = controler(complete, allegee, texte, classes, stylees, sansUsage);
    if (perdues.length) { echecs.push(messageDeControle(feuille, perdues)); continue; }
    ecritures.push([chemin, allegee]);
    bilans.push({ feuille, avant: Buffer.byteLength(complete), apres: Buffer.byteLength(allegee) });
  }
  // Tout, ou rien : aucune feuille n'est écrite si l'une échoue au contrôle.
  if (echecs.length) throw new Error(echecs.join('\n\n'));
  for (const [chemin, css] of ecritures) writeFileSync(chemin, css);
  return bilans;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const site = process.argv[2];
  if (!site) { console.error('Usage : node scripts/alleger/alleger.mjs <dossier du site construit>'); process.exit(2); }
  alleger(site).then((bilans) => {
    for (const b of bilans) console.log(`${b.feuille} : ${(b.avant / 1024).toFixed(0)} Ko → ${(b.apres / 1024).toFixed(0)} Ko`);
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
