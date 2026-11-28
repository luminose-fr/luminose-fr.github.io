/**
 * Le garde du réseau, chargé avant tout essai (`node --import`).
 *
 * Pendant les essais, aucune requête ne quitte la machine : ni celles du Worker,
 * ni celles des outils — wrangler et Miniflare savent appeler Cloudflare (le
 * fichier `cf.json`), npm (la mise à jour) et leur mesure d'usage. Toute
 * connexion vers autre chose que la machine locale est refusée avant de partir,
 * et notée dans le fichier que nomme RECETTE_JOURNAL_RESEAU (ou sur la sortie
 * d'erreur). Les processus enfants héritent du garde par NODE_OPTIONS.
 */
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import { appendFileSync } from 'node:fs';

const LOCAUX = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', '::']);
const local = (hote) => !hote || LOCAUX.has(String(hote).replace(/^\[|\]$/g, '')) || String(hote).startsWith('127.');

const noter = (quoi, hote) => {
  const ligne = `${new Date().toISOString()}\t${process.pid}\t${quoi}\t${hote}\n`;
  if (process.env.RECETTE_JOURNAL_RESEAU) appendFileSync(process.env.RECETTE_JOURNAL_RESEAU, ligne);
  else process.stderr.write(`[garde-réseau] refusé : ${quoi} ${hote}\n`);
};

const hoteDe = (args) => {
  const a = args[0];
  if (a && typeof a === 'object') return a.host ?? a.hostname ?? (a.path ? 'local' : undefined);
  if (typeof a === 'number') return typeof args[1] === 'string' ? args[1] : 'localhost';
  return undefined; // un chemin de socket Unix : local
};

const refuser = (quoi, hote) => {
  noter(quoi, hote);
  const e = new Error(`garde-réseau : ${hote} refusé, aucune requête ne quitte la machine pendant les essais`);
  e.code = 'ECONNREFUSED';
  return e;
};

for (const [mod, nom] of [[net, 'net'], [tls, 'tls']]) {
  const origine = mod.connect;
  const garde = function (...args) {
    const hote = hoteDe(args);
    if (!local(hote)) {
      const s = new net.Socket();
      process.nextTick(() => s.destroy(refuser(`${nom}.connect`, hote)));
      return s;
    }
    return origine.apply(this, args);
  };
  mod.connect = garde;
  if (mod.createConnection) mod.createConnection = garde;
}

const lookup = dns.lookup;
dns.lookup = function (hote, ...reste) {
  if (!local(hote)) {
    const rappel = reste.find((x) => typeof x === 'function');
    const e = refuser('dns.lookup', hote);
    e.code = 'ENOTFOUND';
    return process.nextTick(() => rappel?.(e));
  }
  return lookup.call(this, hote, ...reste);
};
const plookup = dns.promises.lookup;
dns.promises.lookup = (hote, ...reste) => (local(hote) ? plookup(hote, ...reste) : Promise.reject(refuser('dns.lookup', hote)));

// fetch de Node (undici) passe par net.connect, mais se résout avant : on le garde aussi.
const fetchOrigine = globalThis.fetch;
globalThis.fetch = async (entree, init) => {
  const url = new URL(entree instanceof Request ? entree.url : String(entree));
  if (!local(url.hostname)) throw refuser('fetch', url.hostname);
  return fetchOrigine(entree, init);
};
