#!/usr/bin/env node
/**
 * Alléger les feuilles publiées — après `jekyll build`.
 *
 *   node scripts/alleger/alleger.mjs <dossier du site construit>
 *
 * 1. Le retrait : des deux feuilles (css/critical.css, css/main.css), les règles
 *    dont aucun sélecteur ne correspond à ce que le site contient — tout le HTML
 *    construit, et tous les scripts de js/ — sont retirées. Les variables CSS, les
 *    @font-face et les @keyframes restent tels quels. La liste de sauvegarde
 *    (sauvegarde.mjs) garde ce qu'aucun fichier n'écrit en clair.
 *
 * Les sources Sass ne sont pas touchées : seules les feuilles du site construit
 * changent. `./run.sh` sert toujours les feuilles complètes.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PurgeCSS } from 'purgecss';
import { CLASSES, MOTIFS } from './sauvegarde.mjs';

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

/** Les mots du contenu, découpés comme PurgeCSS les découpe : ce qui peut être un nom de classe. */

export const alleger = async (site, { classes = CLASSES, motifs = MOTIFS } = {}) => {
  const chemins = contenus(site);
  const bilans = [];
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
    ecritures.push([chemin, allegee]);
    bilans.push({ feuille, avant: Buffer.byteLength(complete), apres: Buffer.byteLength(allegee) });
  }
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
