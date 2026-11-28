# Ce qui sort du site — le relevé

Relevé du 27/11/2026, sur `master` (6d9b05f), pour fonder la politique de la
recette (`src/regles.js`). Le site, construit comme la production le construit,
servi sur la machine locale ; chaque requête vers autre chose que la machine
locale interceptée avant de partir et notée, dès le premier chargement.

## Comment

- **Les 88 pages** chargées l'une après l'autre, chacune défilée jusqu'en bas.
- **Chaque formulaire** rempli de valeurs d'essai et envoyé : la lettre
  d'information, les questionnaires de santé, la découverte du breathwork.
- **La fenêtre de rendez-vous** ouverte : les boutons `.bt-prise-rdv`,
  `#bt-choix-nouveau-client`, `[id^=bt-seance-]`.
- **Les fenêtres et navigations** produites par script, notées.
- **La lecture du code** — `js/luminose.js`, `_includes/`, `_layouts/` — pour ce
  qu'un parcours ne déclenche pas : les paiements, les préconnexions ajoutées au
  survol, les redirections.

## Ce qui sort

| Origine | Nature | Quand | Classement |
| :--- | :--- | :--- | :--- |
| `i.ytimg.com` | images | vignettes des vidéos (4 pages) | **affichage** — `img-src` |
| `www.youtube-nocookie.com` | cadre | la vidéo, au clic (1 page) | **affichage** — `frame-src` |
| `www.youtube.com` | script, cadre | le lecteur sur appareil Apple (lite-youtube charge `iframe_api`) | **affichage** — `script-src`, `frame-src` |
| `www.luminose.fr` | document | les 6 pages de redirection (`jekyll-redirect-from`, adresse absolue) | **interne** — construites pour la recette, elles visent `recette.luminose.fr` |
| `hook.eu1.make.com` | fetch | les questionnaires (2 pages), le paiement, la confirmation de paiement | **service** — bloqué |
| `assets.calendly.com`, `calendly.com` | script, feuille, cadre | sur presque toutes les pages ; la fenêtre de rendez-vous | **service** — bloqué |
| `payment.stancer.com` | navigation | `payer-seance` : l'adresse vient de la réponse de Make | **service** — bloqué (Make l'est) |
| `js.stripe.com` | script | cité par le code de paiement | **service** — bloqué |
| `sibforms.com`, `*.sibforms.com` (Brevo) | script ; envoi de formulaire | la lettre d'information (68 pages) | **service** — bloqué |
| `www.google.com` | script | reCAPTCHA du formulaire Brevo | **service** — bloqué |
| `www.googletagmanager.com` | script | 80 pages | **service** — bloqué |
| `api-eu.mixpanel.com`, `cdn.mxpnl.com` | xhr, script | 71 pages | **service** — bloqué |
| `fast.fonts.net` | feuille | le comptage de licence de Fonts.com (les polices sont servies par le site) | **service** — bloqué |
| `static.doubleclick.net`, `googleads.g.doubleclick.net`, `www.google.com` | préconnexion | ajoutées au survol d'une vidéo par lite-youtube | **service** — voir plus bas |

Les liens ordinaires — réseaux sociaux, partage, crédits des images — sont des
navigations que la personne choisit ; ils restent, sauf ceux qui mènent à un
service (Calendly, Stancer, Stripe, Make, Brevo…), rendus inertes.

## Les navigations par script

Toutes dépendent d'un appel que la politique bloque, ou restent internes :

- `window.location.href = urlEtapeDeux` (questionnaire) : interne, et seulement
  après une réponse de Make ;
- `_passerAuRendezVous` : interne, après une réponse de Make ;
- après le message de Calendly (`event_scheduled`) : interne, et Calendly ne
  charge pas ;
- `payer-seance` : l'adresse de Stancer est construite d'après la réponse de
  Make, qui ne vient pas ;
- `window.open` du partage sur les réseaux : neutralisé par le script de la
  marque vers toute origine non autorisée.

Aucune navigation par script vers un service ne peut aboutir.

## Ce que la politique ne peut pas retenir

- **Les préconnexions ajoutées par script** (`<link rel="preconnect">` que
  lite-youtube insère au survol, vers Google et DoubleClick). La politique de
  sécurité du contenu ne régit pas les préconnexions. Elles ouvrent une
  connexion et n'envoient aucune donnée de la page ; la réécriture retire
  celles qui sont écrites dans le HTML, pas celles-là.
- **YouTube et les polices de YouTube** gardent leurs échanges avec leur
  fournisseur une fois la vidéo lancée : c'est le prix de l'affichage.

## Ce qu'il faut savoir du site construit pour la production

`_includes/scripts.html` passe `environment: 'production'` à `App.init` quand
`JEKYLL_ENV` vaut `production`. Une branche construite comme la production
porte donc les adresses réelles de Make et la clé publique réelle de Stripe :
c'est la politique du Worker, pas la construction, qui les rend inertes.
