/**
 * La recette du site — un Worker devant les fichiers construits.
 *
 * La recette est un HABILLAGE, pas une variante du site : n'importe quelle
 * branche se construit comme la production la construit, et c'est ce Worker
 * qui la ferme, la rend inerte et la signale. Le site ne contient aucun
 * « si recette ».
 *
 * Il reçoit toute requête avant les fichiers (`run_worker_first`), et fait six
 * choses, dans cet ordre :
 *   1. l'hôte : `recette.luminose.fr` (et la machine locale, en essai), sinon 404 ;
 *   2. le mot de passe (Basic), lu dans le secret RECETTE_MOT_DE_PASSE ; absent
 *      ou vide, TOUT répond 401 — un oubli donne une recette fermée ;
 *   3. les mêmes adresses que GitHub Pages ;
 *   4. les en-têtes, sur toute réponse : noindex, no-store, et la politique de
 *      sécurité du contenu, qui empêche les sorties ;
 *   5. `/robots.txt` interdit tout, `/sitemap.xml` n'existe pas ;
 *   6. sur les pages HTML : la balise robots, les liens et redirections vers un
 *      service rendus inertes, et la marque « Recette ».
 *
 * Aucun fichier `_headers` ne s'applique ici : les réponses passent par le
 * Worker, qui pose lui-même ses en-têtes (documentation Cloudflare, « Headers »).
 */

import { HOTES, IDENTIFIANT, POLITIQUE, ORIGINES_AUTORISEES, estService } from './regles.js';

const ENTETES = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
  'Content-Security-Policy': POLITIQUE,
};

/** Toute réponse repart avec les trois en-têtes, 401 et 404 compris. */
const avecEntetes = (reponse) => {
  const r = new Response(reponse.body, reponse);
  for (const [nom, valeur] of Object.entries(ENTETES)) r.headers.set(nom, valeur);
  r.headers.delete('ETag');
  return r;
};

const texte = (corps, statut, entetes = {}) =>
  avecEntetes(new Response(corps, { status: statut, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...entetes } }));

// ─── Le mot de passe ────────────────────────────────────────────────────────

/** Comparaison à temps constant : deux empreintes de même longueur, comparées octet par octet sans s'arrêter. */
const egaux = async (a, b) => {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let ecart = 0;
  for (let i = 0; i < x.length; i++) ecart |= x[i] ^ y[i];
  return ecart === 0;
};

const DEMANDE = { 'WWW-Authenticate': 'Basic realm="Recette du site Luminose", charset="UTF-8"' };

/** `null` si l'accès est accordé ; sinon la réponse 401. */
const authentifier = async (requete, env) => {
  const attendu = env.RECETTE_MOT_DE_PASSE;
  if (typeof attendu !== 'string' || attendu === '') {
    return texte('Recette fermée : mot de passe non configuré.\n', 401);
  }
  const entete = requete.headers.get('Authorization') ?? '';
  let fourni = '';
  if (entete.startsWith('Basic ')) {
    try {
      fourni = new TextDecoder().decode(Uint8Array.from(atob(entete.slice(6)), (c) => c.charCodeAt(0)));
    } catch {
      fourni = '';
    }
  }
  const separateur = fourni.indexOf(':');
  const identifiant = separateur >= 0 ? fourni.slice(0, separateur) : '';
  const motDePasse = separateur >= 0 ? fourni.slice(separateur + 1) : '';
  // Les deux comparaisons ont toujours lieu : la durée ne dit pas laquelle a échoué.
  const [bonIdentifiant, bonMotDePasse] = await Promise.all([egaux(identifiant, IDENTIFIANT), egaux(motDePasse, attendu)]);
  if (bonIdentifiant && bonMotDePasse) return null;
  return texte('Recette du site : mot de passe requis.\n', 401, DEMANDE);
};

// ─── Les adresses de GitHub Pages ───────────────────────────────────────────

/** Le fichier construit, ou `null`. Les fichiers sont servis tels quels (`html_handling: none`). */
const fichier = async (env, requete, chemin) => {
  const url = new URL(requete.url);
  url.pathname = chemin;
  url.search = '';
  const r = await env.ASSETS.fetch(new Request(url, { method: requete.method === 'HEAD' ? 'HEAD' : 'GET', headers: requete.headers }));
  return r.status === 200 || r.status === 304 ? r : null;
};

/**
 * Ce que GitHub Pages sert pour une adresse — constaté sur www.luminose.fr le
 * 27/11/2026 :
 *   /               → index.html
 *   /dossier/       → dossier/index.html (s'il existe ; sinon 404)
 *   /page.html      → telle quelle, sans redirection
 *   /page           → page.html, sans redirection ; à défaut, si page/index.html
 *                     existe, une redirection vers /page/
 *   tout le reste   → 404.html, statut 404
 */
const servir = async (requete, env) => {
  const url = new URL(requete.url);
  let chemin;
  try {
    chemin = decodeURIComponent(url.pathname);
  } catch {
    chemin = url.pathname;
  }
  if (chemin.includes('\0') || chemin.split('/').includes('..')) return introuvable(requete, env);

  if (chemin.endsWith('/')) {
    const index = await fichier(env, requete, `${url.pathname}index.html`);
    return index ?? introuvable(requete, env);
  }
  const tel = await fichier(env, requete, url.pathname);
  if (tel) return tel;
  if (!/\.[a-z0-9]+$/i.test(chemin)) {
    const page = await fichier(env, requete, `${url.pathname}.html`);
    if (page) return page;
    const dossier = await fichier(env, requete, `${url.pathname}/index.html`);
    if (dossier) {
      const cible = new URL(url);
      cible.pathname = `${url.pathname}/`;
      return new Response(null, { status: 301, headers: { Location: cible.pathname + cible.search } });
    }
  }
  return introuvable(requete, env);
};

const introuvable = async (requete, env) => {
  const page = await fichier(env, requete, '/404.html');
  return page
    ? new Response(page.body, { status: 404, headers: page.headers })
    : new Response('Introuvable.\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

// ─── La réécriture des pages ────────────────────────────────────────────────

/**
 * La marque « Recette » et son script : une pastille fixe, en bas à gauche, qui
 * ne recouvre ni l'en-tête ni les boutons d'action et ne capte pas les clics
 * hors d'elle-même. Elle compte les appels que la politique a bloqués
 * (`securitypolicyviolation`) ; la toucher en donne la liste — le domaine et la
 * nature de l'appel, rien d'autre. Le même script neutralise `window.open` vers
 * une origine non autorisée.
 */
const marque = (branche, commit) => `
<div id="luminose-recette" role="status" style="position:fixed;left:8px;bottom:8px;z-index:2147483647;pointer-events:none;font:600 12px/1.3 system-ui,-apple-system,sans-serif;">
  <button type="button" id="luminose-recette-bouton" style="pointer-events:auto;border:0;border-radius:999px;padding:4px 10px;background:#613F7F;color:#fff;opacity:.88;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:pointer;font:inherit;">
    Recette<span id="luminose-recette-compte"></span>
  </button>
  <div id="luminose-recette-liste" hidden style="pointer-events:auto;margin-top:6px;max-width:min(90vw,360px);max-height:50vh;overflow:auto;padding:8px 10px;border-radius:8px;background:#fff;color:#613F7F;box-shadow:0 2px 10px rgba(0,0,0,.25);font-weight:400;">
    <div style="font-weight:600;margin-bottom:4px;">${echapper(branche)} · ${echapper(commit)}</div>
    <div id="luminose-recette-appels">Aucun appel bloqué sur cette page.</div>
  </div>
</div>
<script>
(function () {
  var bloques = [];
  var autorises = ${JSON.stringify(ORIGINES_AUTORISEES)};
  var compte = document.getElementById('luminose-recette-compte');
  var liste = document.getElementById('luminose-recette-liste');
  var appels = document.getElementById('luminose-recette-appels');
  function afficher() {
    compte.textContent = bloques.length ? ' · ' + bloques.length + ' bloqué' + (bloques.length > 1 ? 's' : '') : '';
    appels.textContent = '';
    if (!bloques.length) { appels.textContent = 'Aucun appel bloqué sur cette page.'; return; }
    bloques.forEach(function (b) {
      var ligne = document.createElement('div');
      ligne.textContent = b.domaine + ' — ' + b.nature;
      appels.appendChild(ligne);
    });
  }
  function noter(domaine, nature) { bloques.push({ domaine: domaine, nature: nature }); afficher(); }
  document.addEventListener('securitypolicyviolation', function (e) {
    var domaine = '';
    try { domaine = new URL(e.blockedURI).hostname; } catch (x) { domaine = e.blockedURI || 'inconnu'; }
    noter(domaine, e.effectiveDirective || e.violatedDirective || 'appel');
  });
  document.getElementById('luminose-recette-bouton').addEventListener('click', function () { liste.hidden = !liste.hidden; });
  var ouvrir = window.open;
  window.open = function (url) {
    try {
      var cible = new URL(url, location.href);
      if (cible.origin !== location.origin && autorises.indexOf(cible.origin) < 0) { noter(cible.hostname, 'fenêtre coupée en recette'); return null; }
    } catch (x) { return null; }
    return ouvrir.apply(window, arguments);
  };
})();
</script>`;

const echapper = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Une adresse lue dans la page, résolue ; `null` si elle est illisible — une page mal écrite ne fait pas tomber le Worker. */
const resoudre = (href, base) => {
  try {
    return new URL(href.trim(), base);
  } catch {
    return null;
  }
};

const autreOrigine = (href, base) => {
  const u = resoudre(href, base);
  return u !== null && /^https?:$/.test(u.protocol) && u.origin !== new URL(base).origin;
};

/** Réécrit une page HTML : balise robots, liens et redirections inertes, marque. */
const reecrire = (reponse, base, env) => {
  const branche = env.RECETTE_BRANCHE || 'branche inconnue';
  const commit = env.RECETTE_COMMIT || '';
  return new HTMLRewriter()
    .on('head', { element: (e) => e.prepend('<meta name="robots" content="noindex, nofollow">', { html: true }) })
    // Une redirection par balise meta vers une autre origine est retirée.
    .on('meta[http-equiv]', {
      element: (e) => {
        if ((e.getAttribute('http-equiv') || '').toLowerCase() !== 'refresh') return;
        const cible = /url\s*=\s*['"]?([^'";]+)/i.exec(e.getAttribute('content') || '')?.[1];
        if (cible && autreOrigine(cible.trim(), base)) e.remove();
      },
    })
    // Les chargements anticipés vers une origine non autorisée sont retirés.
    .on('link[rel]', {
      element: (e) => {
        const rel = (e.getAttribute('rel') || '').toLowerCase();
        if (!/\b(preconnect|dns-prefetch|prefetch|prerender|preload|modulepreload)\b/.test(rel)) return;
        const href = e.getAttribute('href') || '';
        if (autreOrigine(href, base) && !ORIGINES_AUTORISEES.includes(resoudre(href, base).origin)) e.remove();
      },
    })
    // Un lien écrit dans la page vers un service devient inerte, et le dit au survol.
    .on('a[href]', {
      element: (e) => {
        const cible = resoudre(e.getAttribute('href') || '', base);
        if (!cible || !estService(cible.href)) return;
        e.setAttribute('href', '#recette-lien-coupe');
        e.setAttribute('data-recette-lien-coupe', cible.hostname);
        e.setAttribute('title', `Lien coupé en recette (${cible.hostname})`);
        e.removeAttribute('target');
      },
    })
    .on('body', { element: (e) => e.append(marque(branche, commit), { html: true }) })
    .transform(reponse);
};

// ─── Le Worker ──────────────────────────────────────────────────────────────

export default {
  async fetch(requete, env) {
    const url = new URL(requete.url);

    // 1. L'hôte. Une autre adresse — workers.dev, aperçu, version — ne sert rien.
    if (!HOTES.includes(url.hostname)) return avecEntetes(new Response(null, { status: 404 }));

    // 2. Le mot de passe, avant tout fichier : robots.txt compris.
    const refus = await authentifier(requete, env);
    if (refus) return refus;

    if (requete.method !== 'GET' && requete.method !== 'HEAD') return texte('Méthode non permise en recette.\n', 405, { Allow: 'GET, HEAD' });

    // 5. robots.txt et sitemap.xml : ceux de la recette, pas ceux du site.
    if (url.pathname === '/robots.txt') return texte('User-agent: *\nDisallow: /\n', 200);
    if (url.pathname === '/sitemap.xml') return texte('Introuvable.\n', 404);

    // 3. Les adresses de GitHub Pages.
    const reponse = await servir(requete, env);

    // 6. Les pages HTML, réécrites ; le reste, tel quel.
    const type = reponse.headers.get('Content-Type') || '';
    const finale = type.includes('text/html') && requete.method === 'GET' ? reecrire(reponse, url.href, env) : reponse;

    // 4. Les en-têtes, sur toute réponse.
    return avecEntetes(finale);
  },
};
