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

## Workflow Git

- Le site est publié par **GitHub Pages** depuis la branche de production. **Ne jamais committer directement dessus.**
- Chaque chantier se fait sur une branche dédiée, indiquée dans le brief. Un commit par tâche, messages clairs en français.
- La refonte structurelle (navigation, nouvelles pages) vit sur une branche longue durée : elle n'est mergée qu'après validation visuelle complète par Florent (desktop et mobile, thèmes clair et sombre).
- À la fin de chaque session : `bundle exec jekyll build` sans erreur, puis pousser la branche et résumer les changements — ne pas merger soi-même sauf instruction explicite.

## Garde-fous absolus

1. **Ne jamais casser une URL existante.** Tout renommage ou déplacement exige une redirection 301 (ou équivalent selon l'hébergeur).
2. **Ne jamais créer, modifier ou inventer un témoignage.** Les témoignages existants ne se retouchent pas (orthographe comprise) sans validation explicite.
3. **Ne pas toucher** aux contre-indications médicales (pages breathwork, événements) ni au `questionnaire-sante` sans validation explicite de Florent.
4. Ne pas modifier les tarifs, durées ou conditions d'annulation sans instruction explicite.
5. Rester dans le périmètre du brief de la phase en cours. Signaler ce qui semble manquer plutôt que l'improviser.

## Palette de marque (pour toute création visuelle)

- Violet profond : `#38154B`
- Rose doux : `#E5C7CD`
- Fond clair : `#F5EDEF`
