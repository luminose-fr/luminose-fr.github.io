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

/**
 * Les classes que les feuilles du site (_sass/ui-*.scss) stylent, et qu'aucune
 * page n'emploie aujourd'hui : leurs règles sont retirées, et c'est voulu.
 * Le contrôle exige qu'une classe stylée par le site soit employée, sauvée
 * ci-dessus, ou déclarée ici : retirer de CLASSES une classe posée par un outil
 * extérieur fait donc échouer la construction, en la nommant.
 */
export const SANS_USAGE = [
  // Composées par les gabarits Liquid (« evenement-{{ type }} ») : dès qu'un évènement de
  // ce type est publié, la classe est dans le HTML construit et ses règles restent d'elles-mêmes.
  'evenement-hypnose', 'evenement-meditation', 'evenement-respiration-holotropique',
  // Le calendrier des évènements (mois, année) et son bouton, absents des pages actuelles.
  'annee', 'mois-annee', 'bt-evenements',
  // Les formulaires d'inscription et de paiement d'avant la refonte.
  'amount-input', 'inscription-rapide', 'with-push-confirmation',
  // Des icônes de la police du site qu'aucune page n'affiche.
  'icon-chevron-droite', 'icon-etoile', 'icon-relations',
  // Des retouches de composants Bulma que le site n'emploie plus (tuiles, liens de menu
  // déroulant, infobulle à droite, demi-colonne sur ordinateur).
  'tile', 'is-ancestor', 'navbar-link', 'has-tooltip-right', 'is-half-desktop',
  // Des utilitaires du site restés sans usage.
  'heavy-purple-border', 'no-padding-right',
];
