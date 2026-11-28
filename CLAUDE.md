# CLAUDE.md — Site Luminose (luminose.fr)

Ce fichier définit les règles à respecter pour toute intervention sur ce site.
Il prime sur toute habitude ou convention générale. En cas de doute : demander à Florent, ne pas trancher seul.

## Contexte

Site Jekyll de **Luminose**, la pratique de **Florent Jaouali, psychopraticien transpersonnel** à Villefranche-de-Lauragais (31). Pratique : clarification verbale, hypnose, méditation, breathwork holotropique — dans le cadre de parcours d'accompagnement (pas de séances ponctuelles).

Un chantier de refonte progressive est en cours. Chaque étape fait l'objet d'un brief séparé fourni par Florent. Ne pas anticiper les étapes suivantes.

**Ce dépôt est public.** Les briefs de travail ne sont **jamais committés** dans le dépôt (les garder hors du répertoire git, ou ajouter leur emplacement au `.gitignore`). Ne jamais écrire dans le dépôt d'informations de stratégie commerciale, de tarification interne ou de données personnelles de clients.

## Identité et positionnement

- L'identité de Florent est **« psychopraticien transpersonnel »**. Ne jamais le désigner comme « hypnothérapeute » dans les contenus rédigés (H1, corps de texte, signatures). L'hypnose est un outil et un mot-clé de recherche, pas une identité.
- Le mot « hypnose » reste légitime et souhaitable dans les `title`, `meta description` et URL des pages concernées (référencement).
- Le modèle est le **parcours** : premier échange offert de 20 minutes (« entretien préalable »), puis accompagnement dans la durée. Aucun contenu ne doit présenter les séances comme un produit à l'unité.
- **Une exception, décidée par Florent le 06/10/2026** : une séance de découverte du breathwork holotropique, sans suite, est possible — toujours après le questionnaire de santé et l'échange de 20 minutes. Elle a sa landing de campagne, `respiration-holotropique/decouverte.html` (layout `campagne`, sans navigation), puis trois étapes : `decouverte-rendez-vous.html` (le rendez-vous, pris sur le site, type `rencontre_breathwork`), `decouverte-questionnaire.html` (le questionnaire de santé), `decouverte-confirmation.html`.

## Règles terminologiques

### Breathwork holotropique / respiration holotropique
- **« breathwork holotropique »** = terme de marque : menus, H1, corps de texte.
- **« respiration holotropique »** = conservé dans les `title`, `meta description`, URL existantes (référencement) et en apposition pédagogique à la première occurrence d'une page : « le breathwork holotropique (respiration holotropique) ».
- Ne jamais renommer une URL existante contenant « respiration-holotropique ».

### Vocabulaire de la pratique
Termes en usage : *entretien préalable*, *accompagnement*, *parcours*, *respirant / accompagnant* (rôles en breathwork de groupe), *intégration*, *séance d'intégration*. Utiliser « les personnes que j'accompagne », « consultant » ou « client » — jamais « patient ».

### Règle du sujet grammatical (vocabulaire médical)
Florent est psychopraticien, pas professionnel de santé. Par rigueur et conformité, le site ne doit jamais le présenter comme accomplissant un acte médical. Les termes comme *diagnostic*, *cabinet*, *clinique* ne sont pas interdits, mais leur sujet grammatical doit toujours être un professionnel de santé ou rester générique.
- À éviter : « mon cabinet », « je diagnostique », « ma clinique ».
- Correct : « diagnostiqué par un professionnel de santé », « en séance, à Villefranche-de-Lauragais », « mon espace d'accompagnement », « la question que se posent les cliniciens ».

## Ton et style éditorial

- Conversationnel et oral, paragraphes courts, chaleur sobre et retenue.
- Métaphores filées bienvenues (le site en utilise : navigation maritime, jardin, colocataire, musique intérieure).
- **Jamais d'emojis.**
- Aucune promesse de résultat thérapeutique ni de guérison garantie. On décrit un cadre, une pratique, un chemin — pas un résultat.
- Français impeccable : relire l'orthographe de chaque texte ajouté ou modifié.

## Conventions techniques

- **Jekyll** ; CSS basé sur **Bulma** (`columns`, `column is-5`, `button is-white is-medium`, `section`, `container`…).
- Articles dans `_posts/`, layout `colonne`. Frontmatter type : `layout`, `title`, `image_name`, `section`, `category`, `tag`, `description`, `summary`.
- Includes récurrents : `liens-partage.html`, `bandeaux/bandeau-auteur.html`, `bandeaux/bandeau-temoignages.html`, `bandeaux/bandeau-plus-loin-hypnose.html`. Tag custom : `{% bouton_rendez_vous is-white %}`.
- Images du blog : `/images/blog/{image_name}.jpg` + variante `@2x`.
- Encodage **UTF-8** partout. Vérifier qu'aucune modification n'introduit de caractères mal encodés.
- Après toute modification : `jekyll build` (ou `bundle exec jekyll build`) doit passer sans erreur ni warning nouveau.
- **Les feuilles publiées sont allégées à la construction.** `scripts/construire.sh` (celui qu'appelle le workflow de publication) fait `jekyll build`, puis retire de `css/critical.css` et `css/main.css` les règles qu'aucune page ni aucun script de `js/` n'emploie. Les sources Sass ne changent pas.
- Une classe qu'un script compose sans l'écrire en clair, ou qu'un outil extérieur pose dans la page (Calendly, reCAPTCHA…), s'ajoute à la liste de sauvegarde, `scripts/alleger/sauvegarde.mjs`, avec sa raison. Une classe stylée dans `_sass/ui-*.scss` qu'aucune page n'emploie plus s'y déclare sans usage.
- Sinon, le contrôle de la construction échoue, et la publication avec : son message nomme la classe et dit quoi faire.
- `./run.sh` sert les feuilles complètes, sans retrait. Pour voir le site tel qu'il sera publié : `./scripts/construire.sh` (outils : `npm ci --prefix scripts/alleger`). Pour comparer deux constructions page par page : `_ai_helpers/comparer-pages/`.

## Workflow Git

- Le site est publié par **GitHub Pages** depuis la branche de production. **Ne jamais committer directement dessus.**
- Chaque chantier se fait sur une branche dédiée, indiquée dans le brief. Un commit par tâche, messages clairs en français.
- La refonte structurelle (navigation, nouvelles pages) vit sur une branche longue durée : elle n'est mergée qu'après validation visuelle complète par Florent (desktop et mobile, thèmes clair et sombre).
- À la fin de chaque session : `bundle exec jekyll build` sans erreur, puis pousser la branche et résumer les changements — ne pas merger soi-même sauf instruction explicite.

## Recette

Une branche se regarde avant d'être fusionnée sur **https://recette.luminose.fr** :
le site construit comme la production le construit, servi par un Worker
Cloudflare (`_recette/`) qui le ferme, le rend inerte et le signale.

**Ses quatre garanties**, que tout changement doit garder :

1. **Fermée par défaut.** 401 partout sans le mot de passe (secret
   `RECETTE_MOT_DE_PASSE`, posé par `wrangler secret put`). Secret absent : 401
   partout aussi. Ni workers.dev, ni aperçu, ni adresse de version.
2. **Jamais indexée.** 401, plus `X-Robots-Tag: noindex, nofollow` sur toute
   réponse, la balise robots dans chaque page, un `robots.txt` qui interdit tout,
   pas de sitemap. Un écart, décidé par Florent le 27/11/2026 : le « robots.txt
   géré » de la zone Cloudflare reste activé (il bloque les robots d'IA, production
   comprise). Il place son bloc — dont `User-agent: *` / `Allow: /` — devant le
   nôtre, et répond même sans mot de passe. Les pages, elles, restent en 401 et
   noindex ; `controler.sh` vérifie que notre `Disallow: /` suit ce bloc.
3. **Inerte.** Rien ne part vers Make, Calendly, Stripe, Stancer, Brevo, Tag
   Manager, Google Ads ni Mixpanel : la politique de sécurité du contenu du
   Worker les bloque, et les liens vers ces services sont rendus inertes. Rien
   n'est mesuré en recette.
4. **Reconnaissable.** La pastille « Recette » sur chaque page ; la toucher
   montre la branche, le commit, et les appels bloqués.

**Qui la met en recette : Florent seul**, depuis la VM, dans une copie de
`master` à jour et propre : `_recette/mettre-en-recette.sh <branche>`
(`--essai` pour tout voir sans rien déployer). Une session ne lance jamais
`wrangler deploy` ni `wrangler secret`.

**Pas de « si recette » dans le site.** Le site ne sait pas qu'il est en
recette : `_config.recette.yml`, chargé en second, ne change que des adresses,
et `_recette/comparer.sh` le prouve. Ses clés :

- `url` : `https://recette.luminose.fr` ;
- `environnement` : `recette` (absente en production) ;
- `api_origine` : l'origine de l'API de gestion, `https://api-recette.luminose.fr`
  en recette. Un template qui appelle l'API écrit
  `{{ site.api_origine | default: "https://api.luminose.fr" }}`, jamais une
  adresse en dur.

**Une origine nouvelle, nécessaire à l'affichage** (une police, un lecteur, des
images d'un tiers), s'ajoute dans `_recette/src/regles.js`, dans sa seule
directive, avec ses essais. Sans quoi la recette la bloque, et c'est voulu : un
service ne s'y ajoute jamais.

Le détail : `_recette/RELEVE.md` (ce qui sort du site), et les essais de
`_recette/test/` (`npm test` dans `_recette/`, sur la VM).

## Garde-fous absolus

1. **Ne jamais casser une URL existante.** Tout renommage ou déplacement exige une redirection 301 (ou équivalent selon l'hébergeur).
2. **Ne jamais créer, modifier ou inventer un témoignage.** Les témoignages existants ne se retouchent pas (orthographe comprise) sans validation explicite.
3. **Ne pas toucher** aux contre-indications médicales (pages breathwork, événements) ni au `questionnaire-sante` sans validation explicite de Florent.
4. Ne pas modifier les tarifs, durées ou conditions d'annulation sans instruction explicite.
5. Rester dans le périmètre du brief de la phase en cours. Signaler ce qui semble manquer plutôt que l'improviser.

## Palettes

Deux palettes, deux usages : ne pas les mélanger.

**Interface** (bandeaux, fonds, boutons, liens) — celle de `_sass/ui-variables.scss`, qui fait foi :

- Violet principal : `#613F7F`
- Violet-bleu : `#6163A5`
- Violet alternatif : `#60407F`
- Fond clair : `#F9F5FF`
- Bordure claire : `#E8DEF6`

**Illustrations des pages** (hors blog) — gamme chaude et voilée, de l'ivoire au violet nuit :
`#FDEEE1` · `#FBE2D5` · `#E9B9BB` · `#C98FA5` · `#9A688E` · `#634575` · `#3C3061`.
Elles se génèrent avec l'image de référence jointe : voir `_ai_helpers/prompts-images-luminose.md`.

**Illustrations du blog** — pas de charte, par choix : le plus souvent une scène réaliste qui montre
la métaphore de l'article. L'image de référence et la gamme ci-dessus ne s'y appliquent pas.
