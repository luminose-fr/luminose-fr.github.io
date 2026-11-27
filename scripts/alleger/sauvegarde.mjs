/**
 * La liste de sauvegarde : ce que les feuilles allégées gardent alors qu'aucun
 * fichier du site ne l'écrit en clair.
 *
 * Le retrait garde toute règle dont un sélecteur correspond à un mot du HTML
 * construit ou des scripts de js/. Une classe que personne n'écrit telle quelle
 * — composée par un script, posée par un outil extérieur, ou réservée à un état
 * du thème — serait retirée sans bruit. Elle s'inscrit ici, avec sa raison.
 *
 * Courte, et chaque entrée dit pourquoi elle est là. Si une entrée n'a plus de
 * raison, on la retire, et on relance la comparaison des pages.
 */

/** Des classes exactes. */
export const CLASSES = [
  // Posées par le script de Calendly sur la fenêtre de rendez-vous qu'il ouvre ;
  // _sass/ui-shared.scss les ajuste.
  'calendly-overlay',
  'calendly-popup',
  // Posée par le script de reCAPTCHA sur son badge ; le site le masque.
  'grecaptcha-badge',
  // L'état sombre forcé par classe. Aucune bascule ne le pose aujourd'hui ;
  // _sass/ui-dark.scss et ui-campagne.scss l'ont prévu, il reste prêt.
  'theme-dark',
];

/** Des motifs : toute règle dont un sélecteur contient le motif est gardée entière. */
export const MOTIFS = [
  // L'état sombre forcé par attribut ([data-theme=dark]), comme pour theme-dark.
  // Bulma s'en sert aussi pour ses variables de thème.
  /data-theme/,
];
