/**
 * Les règles de la recette : qui est servi, ce qui peut sortir, ce qui est un
 * service. Un module à part parce qu'un Worker ne peut exporter que des
 * gestionnaires : tout autre export de son module principal empêche workerd de
 * démarrer.
 *
 * Une origine nouvelle, nécessaire à l'affichage (une police, un lecteur, des
 * images), s'ajoute ICI, dans sa seule directive — jamais dans le site
 * (CLAUDE.md, « Recette »).
 */

/** Les hôtes servis. La machine locale sert aux essais (`wrangler dev`). */
export const HOTES = ['recette.luminose.fr', 'localhost', '127.0.0.1'];

/** L'identifiant de l'authentification : fixe, il ne protège rien à lui seul. */
export const IDENTIFIANT = 'recette';

/** L'API de gestion en recette (SPEC de gestion, §14.8) : la seule destination de requêtes et de formulaires. */
export const API_RECETTE = 'https://api-recette.luminose.fr';

/**
 * La politique de sécurité du contenu (garantie 3). Elle part de `default-src
 * 'none'` et n'ouvre que le nécessaire, usage par usage. Les scripts et styles
 * en ligne du site restent permis : elle empêche les sorties, elle ne durcit pas
 * le site.
 *
 * Les origines « nécessaires à l'affichage » relevées sur les 88 pages :
 * - les vignettes YouTube (`i.ytimg.com`), en images seulement ;
 * - la vidéo intégrée (`www.youtube-nocookie.com`), en cadre ; sur iPhone, le
 *   lecteur passe par l'API de YouTube (`www.youtube.com`, script et cadre).
 * Tout le reste est un service, et bloqué : Make, Calendly, Stripe, Stancer,
 * Brevo (formulaires et reCAPTCHA), Tag Manager, Google Ads, Mixpanel, et le
 * comptage de licence de Fonts.com (les polices sont servies par le site).
 */
export const POLITIQUE = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline' https://www.youtube.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://i.ytimg.com",
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self' ${API_RECETTE}`,
  `form-action 'self' ${API_RECETTE}`,
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
  "manifest-src 'self'",
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Les services, par domaine : un lien écrit dans la page vers l'un d'eux (une
 * page de réservation, un lien de paiement) est rendu inerte. La politique ne
 * retient pas une navigation : la réécriture le fait.
 */
export const SERVICES = [
  'calendly.com', 'stancer.com', 'stripe.com', 'make.com', 'sibforms.com', 'brevo.com', 'sendinblue.com',
  'mixpanel.com', 'mxpnl.com', 'googletagmanager.com', 'google-analytics.com', 'doubleclick.net',
  'googleadservices.com', 'fonts.net', 'qonto.com',
];

/** Les origines vers lesquelles une page peut ouvrir une fenêtre ou se précharger. */
export const ORIGINES_AUTORISEES = ['https://www.youtube-nocookie.com', 'https://www.youtube.com', 'https://i.ytimg.com'];

export const estService = (url) => {
  try {
    const hote = new URL(url).hostname;
    return SERVICES.some((d) => hote === d || hote.endsWith(`.${d}`));
  } catch {
    return false;
  }
};
