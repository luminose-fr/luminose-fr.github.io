# Charte de prompts images Luminose — ChatGPT Images 2.0

Document de travail durable : ces règles valent pour les 6 images des nouvelles pages **et** pour toute image future (blog, réseaux). La cause des résultats hétérogènes : un prompt qui décrit le sujet sans verrouiller le médium laisse le modèle choisir — photo un jour, dessin le lendemain. Tout part donc du bloc de style.

---

## 1. Le bloc de style Luminose (à copier TEL QUEL, jamais paraphrasé)

> Illustration numérique éditoriale, douce et contemporaine. Formes simplifiées aux contours organiques, aplats subtilement texturés avec un léger grain de papier, ombres douces et diffuses. Absolument aucun photoréalisme. Palette strictement limitée : violet profond (#38154B), mauve intermédiaire, rose poudré (#E5C7CD), crème (#F5EDEF) — le crème domine les fonds, le violet structure, le rose réchauffe. Lumière calme et enveloppante, atmosphère contemplative et rassurante. Silhouettes humaines stylisées, sans traits de visage détaillés. Composition épurée, beaucoup d'espace négatif. Aucun texte, aucun logo, aucun cadre décoratif.

## 2. La mécanique d'homogénéité (4 gestes)

1. **L'étalon.** Génère d'abord l'image 1 (le sentier) avec son prompt complet ci-dessous. Itère par retouches conversationnelles (« garde tout, éclaircis le ciel ») jusqu'à ce qu'elle te plaise vraiment : elle devient l'étalon de la série.
2. **La référence.** Pour chaque image suivante, **dans la même conversation**, joins l'image étalon et utilise le prompt court correspondant (« Dans exactement le même style, la même palette, le même grain et le même traitement des silhouettes que l'image jointe : … »). C'est le mécanisme le plus fiable d'Images 2.0 pour tenir un style.
3. **La série.** Si tu utilises le mode Thinking, tu peux demander plusieurs images cohérentes d'un coup ; sinon, une par une dans la même conversation fonctionne très bien.
4. **L'archive.** Garde l'étalon précieusement : toute image future (article de blog, post) se génère avec lui en référence. C'est lui, ta charte graphique vivante — plus que le texte.

## 3. Corrections de dérive (phrases prêtes)

- **Ça vire photo** → régénère en ajoutant en tête : « Ceci est une illustration au grain de papier visible, à aplats stylisés — aucun rendu photographique, aucune texture réaliste de peau, de tissu ou de feuillage. »
- **Ça vire cartoon / enfantin** → ajoute : « Style éditorial adulte, élégant et minimal — pas de style cartoon, pas de personnages mignons, pas de contours noirs épais. »
- **Du texte apparaît** → « Régénère à l'identique en supprimant tout texte et toute lettre. »
- **La palette dérive** → « Ramène toutes les couleurs dans la palette : violet profond #38154B, mauve, rose poudré #E5C7CD, crème #F5EDEF. »
- **Il retouche l'image de référence au lieu d'en créer une nouvelle** → ouvre le prompt par : « Nouvelle image indépendante — l'image jointe sert uniquement de référence de style, de palette et de grain : … »
- **Le sujet devient un schéma** (courbes, flèches, labels « inspirer/expirer ») → les processus abstraits (respiration, cycles, étapes) doivent être incarnés dans une scène figurative — une silhouette qui respire, un paysage qui ondule — et le prompt doit interdire explicitement : « pas de schéma, pas de courbe, pas de flèche, aucun texte ni lettre. »
- **Une scène de groupe devient ambiguë** (corps allongés + lumière tamisée = lecture équivoque) → espacer nettement les silhouettes, asseoir bien droit les accompagnants, éclaircir la lumière — ou montrer le lieu préparé, sans personne : souvent plus juste et toujours sans risque.
- **Un détail cloche** → préfère la retouche ciblée à la régénération : « Garde toute l'image, change uniquement [X]. »

---

## 4. Les six prompts

### Image 1 — L'ÉTALON : `premier-pas-sentier` (format 2:1, bannière)

> Illustration numérique éditoriale, douce et contemporaine. Formes simplifiées aux contours organiques, aplats subtilement texturés avec un léger grain de papier, ombres douces et diffuses. Absolument aucun photoréalisme. Palette strictement limitée : violet profond (#38154B), mauve intermédiaire, rose poudré (#E5C7CD), crème (#F5EDEF) — le crème domine les fonds, le violet structure, le rose réchauffe. Lumière calme et enveloppante, atmosphère contemplative et rassurante. Silhouettes humaines stylisées, sans traits de visage détaillés. Composition épurée, beaucoup d'espace négatif. Aucun texte, aucun logo, aucun cadre décoratif.
>
> Sujet : un sentier qui part du bord inférieur de l'image et s'enfonce en courbe douce vers une lumière de matin, entre de hautes herbes et quelques arbres stylisés. Le seuil d'un chemin, l'invitation à un premier pas. Aucun personnage — ou une unique silhouette de dos, à peine esquissée, au départ du sentier.
>
> Format : horizontal 2:1.

### Images 2 à 6 — prompts courts, avec l'étalon joint en référence

*(Si tu génères sans référence — nouvelle conversation, étalon indisponible — préfixe chacun du bloc de style complet de la section 1.)*

**Image 2 — `premier-pas-accompagnement` (carré 1:1)**
> Dans exactement le même style, la même palette, le même grain et le même traitement des silhouettes que l'image jointe : deux silhouettes marchant côte à côte sur un sentier, l'une légèrement en retrait de l'autre — proximité bienveillante, ni portée ni tirée. Vue de dos, distance moyenne. Format carré 1:1.

**Image 3 — `marcher-ensemble-cercle` (format 2:1, bannière)**
> Dans exactement le même style, la même palette, le même grain et le même traitement des silhouettes que l'image jointe : plusieurs sentiers convergeant vers une clairière où un cercle est suggéré — coussins ou pierres claires disposés en rond, lumière douce au centre. Rassemblement paisible, vu en légère plongée. Aucun personnage ou quelques silhouettes lointaines. Format horizontal 2:1.

**Image 4 — `famille-journee-breathwork` (format 4:3)**
> Dans exactement le même style, la même palette, le même grain et le même traitement des silhouettes que l'image jointe : intérieur chaleureux vu à distance, des matelas disposés en étoile ou en cercle, une silhouette allongée et une silhouette assise à ses côtés, main posée près d'elle ; lumière tamisée, quelques lampes douces stylisées. Format 4:3.

**Image 5 — `famille-stage-theme` (format 4:3)**
> Dans exactement le même style, la même palette, le même grain et le même traitement des silhouettes que l'image jointe : un petit groupe de silhouettes assises en cercle de parole dans une pièce lumineuse, carnets et coussins posés au sol, atmosphère à la fois studieuse et chaleureuse. Format 4:3.

**Image 6 — `famille-parcours-ferme` (format 4:3)**
> Dans exactement le même style, la même palette, le même grain et le même traitement des silhouettes que l'image jointe : évocation d'intimité et de confiance — un petit cercle serré de quelques silhouettes, vu de loin dans un halo de lumière chaude au sein d'un espace plus sombre, ou à travers une porte entrouverte. Ambiance : confiance, pas secret. Format 4:3.

---

## 5. Variante thème sombre (seulement si nécessaire)

Teste d'abord chaque image claire dans les deux thèmes du site : le fond crème passe généralement bien en sombre. Si un emplacement jure vraiment, génère une variante à partir de l'image validée jointe en référence :

> La même image exactement, en variante nocturne : fond violet profond (#38154B), sujets en crème et rose poudré, même composition, même grain.

## 6. Transposer une photo existante en illustration charte

Pour réinterpréter une photo (stock, archive, inspiration) dans le style Luminose : joindre **deux images** — l'étalon d'abord, la photo ensuite — et expliciter le rôle de chacune :

> Nouvelle image indépendante — la première image jointe sert uniquement de référence de style, de palette et de grain ; la seconde (photo) sert uniquement de référence de composition et de sujet, à réinterpréter entièrement en illustration : [décrire la scène avec tes mots, en transposant les couleurs dans la palette]. Aucun texte. Format [ratio].

Règles : décrire la scène plutôt que demander de « copier la photo » (le résultat doit être une œuvre originale dans ton langage, pas un décalque) ; transposer explicitement les couleurs vers la palette ; simplifier les détails identifiants (accessoires, vêtements, visages). Pièges connus : ciels étoilés, feuillages et textures naturelles ramènent au photoréalisme — imposer « aplats illustrés, aucun rendu photographique » pour ces sujets.

## 7. Gabarit pour toute image future

> [Étalon joint] Nouvelle image indépendante — l'image jointe sert uniquement de référence de style, de palette et de grain : [sujet en 2-3 phrases : quoi, où, quelle ambiance — toujours une scène figurative, jamais un concept abstrait]. [Cadrage : distance, angle]. Aucun texte. Format [2:1 / 1:1 / 4:3 / 3:4].

Règles de sujet à conserver partout : silhouettes sans visages détaillés, pas de représentation littérale d'états de détresse, pas de symboles ésotériques appuyés, aucun texte dans l'image.

## 8. Intégration au site

Exporter en qualité haute, redimensionner aux dimensions cibles du brief de finition (bannières ~1200 px de large, vignettes ~800 px), créer les variantes `@2x`, nommer selon le brief (`premier-pas-sentier.jpg`, etc.) et déposer dans `/images/`. Claude Code remplace alors les placeholders.
