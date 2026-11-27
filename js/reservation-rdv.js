// Prendre un rendez-vous (_includes/reservation/rendez-vous.html) : le choix du créneau.
//
// Le moteur d'écrans est celui du questionnaire (js/reservation.js) : il vérifie, garde
// les réponses dans l'onglet, gère « Retour » et l'historique, et envoie. Ce script, chargé
// AVANT lui, n'apporte que ce qui est propre à la réservation : lire les créneaux libres,
// dessiner le calendrier du mois et les heures du jour choisi, tenir le récapitulatif à
// jour, et dire quoi faire quand le créneau vient d'être pris.
//
// Le modèle est celui de Calendly (Florent, 26/11) : les jours libres ressortent dans le
// mois ; un jour choisi montre ses heures ; une heure choisie fait apparaître « Suivant »
// à côté d'elle. Sur téléphone, les heures prennent la place du calendrier.
//
// Ce que la page demandera à gestion (contrat /v1) :
// - GET  /v1/reservation/creneaux?type=…&du=…&au=…  → les débuts libres, rien d'autre ;
// - POST /v1/reservation                            → une référence, ou un refus.
// Elle n'apprend jamais si une adresse e-mail est connue.
(function () {
  'use strict';

  var form = document.querySelector('[data-rendez-vous]');
  if (!form) return;

  var type = form.dataset.type;
  var adresse = new URLSearchParams(location.search);
  var simuler = adresse.get('simuler');

  var ecran = form.querySelector('[data-ecran="creneau"]');
  var attente = form.querySelector('[data-rdv-attente]');
  var blocChoix = form.querySelector('[data-rdv-choix]');
  var blocVide = form.querySelector('[data-rdv-vide]');
  var blocPanne = form.querySelector('[data-rdv-panne]');
  var titre = form.querySelector('[data-rdv-titre]');
  var libelleMois = form.querySelector('[data-rdv-mois]');
  var boutonAvant = form.querySelector('[data-rdv-mois-precedent]');
  var boutonApres = form.querySelector('[data-rdv-mois-suivant]');
  var grille = form.querySelector('[data-rdv-jours]');
  var moisVide = form.querySelector('[data-rdv-mois-vide]');
  var erreurCreneau = form.querySelector('[data-rdv-erreur-creneau]');
  var fuseau = form.querySelector('[data-rdv-fuseau]');
  var blocHeures = form.querySelector('[data-rdv-heures]');
  var sansJour = form.querySelector('[data-rdv-sans-jour]');
  var jourChoisi = form.querySelector('[data-rdv-jour-choisi]');
  var listeHeures = form.querySelector('[data-rdv-liste-heures]');
  var erreurHeure = form.querySelector('[data-rdv-erreur-heure]');
  var recapQuand = form.querySelector('[data-rdv-recap-quand]');

  var creneaux = [];   // débuts libres, en texte ISO avec décalage
  var pret = false;
  var mois = '';       // le mois affiché, « AAAA-MM »
  var jour = '';       // le jour choisi, « AAAA-MM-JJ »

  // À partir de la tablette, le calendrier et les heures tiennent côte à côte.
  var coteACote = window.matchMedia('(min-width: 769px)');

  // ——— L'heure de Paris, quel que soit le réglage de l'appareil ———
  var FUSEAU = 'Europe/Paris';
  function parties(instant) {
    var p = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: FUSEAU, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).formatToParts(instant).forEach(function (x) { p[x.type] = x.value; });
    return p;
  }
  function deux(n) { return (n < 10 ? '0' : '') + n; }
  function majuscule(texte) { return texte.charAt(0).toUpperCase() + texte.slice(1); }
  function cleDuJour(iso) { return iso.slice(0, 10); }
  // Midi, en temps universel : le même jour à Paris, été comme hiver.
  function midi(cleJour) { return new Date(cleJour + 'T12:00:00Z'); }
  function libelleJour(instant, avecAnnee) {
    var options = { weekday: 'long', day: 'numeric', month: 'long', timeZone: FUSEAU };
    if (avecAnnee) options.year = 'numeric';
    return majuscule(new Intl.DateTimeFormat('fr-FR', options).format(instant));
  }
  function libelleHeure(iso) {
    var p = parties(new Date(iso));
    return Number(p.hour) + ' h' + (p.minute !== '00' ? ' ' + p.minute : '');
  }
  function aujourdhui() {
    var p = parties(new Date());
    return p.year + '-' + p.month + '-' + p.day;
  }

  // ——— MAQUETTE : des créneaux inventés, à la place de l'appel à gestion ———
  // Mêmes règles que les vraies : lundi et jeudi, trois plages, la fenêtre et le pas du
  // type. Une partie des créneaux est retirée, toujours la même pour une date donnée.
  var TYPES = {
    rencontre:            { duree: 20,  marge: 0,  pas: 30, debutH: 12,  finH: 4392 },
    rencontre_breathwork: { duree: 20,  marge: 0,  pas: 30, debutH: 12,  finH: 4392 },
    seance:               { duree: 90,  marge: 0,  pas: 90, debutH: 504, finH: 4392 },
    seance_distance:      { duree: 90,  marge: 0,  pas: 90, debutH: 504, finH: 4392 },
    seance_enfant:        { duree: 60,  marge: 0,  pas: 60, debutH: 504, finH: 4392 },
    seance_breathwork:    { duree: 105, marge: 15, pas: 60, debutH: 504, finH: 4392 }
  };
  var PLAGES = [[9 * 60 + 30, 11 * 60 + 30], [13 * 60, 16 * 60], [16 * 60 + 30, 19 * 60 + 30]];
  var JOURS_OUVERTS = [1, 4];   // lundi, jeudi

  function isoParis(a, m, j, minutes) {
    // Le décalage de Paris ce jour-là (heure d'été ou d'hiver), lu sur midi.
    var repere = new Date(Date.UTC(a, m - 1, j, 12));
    var p = parties(repere);
    var decalage = Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - repere.getTime()) / 60000);
    var d = Math.abs(decalage);
    return a + '-' + deux(m) + '-' + deux(j) + 'T' + deux(Math.floor(minutes / 60)) + ':' + deux(minutes % 60) + ':00' +
      (decalage >= 0 ? '+' : '-') + deux(Math.floor(d / 60)) + ':' + deux(d % 60);
  }
  function inventer() {
    var regle = TYPES[type] || TYPES.seance;
    var maintenant = Date.now();
    var ouverture = maintenant + regle.debutH * 3600000;
    var fermeture = maintenant + regle.finH * 3600000;
    var depart = parties(new Date(maintenant));
    var liste = [];
    for (var n = 0; n <= 190; n += 1) {
      var date = new Date(Date.UTC(+depart.year, +depart.month - 1, +depart.day + n));
      if (JOURS_OUVERTS.indexOf(date.getUTCDay()) < 0) continue;
      var a = date.getUTCFullYear(), m = date.getUTCMonth() + 1, j = date.getUTCDate();
      PLAGES.forEach(function (plage) {
        for (var t = plage[0]; t + regle.duree + regle.marge <= plage[1]; t += regle.pas) {
          var iso = isoParis(a, m, j, t);
          var instant = new Date(iso).getTime();
          if (instant < ouverture || instant > fermeture) continue;
          // Environ un créneau sur trois est déjà pris.
          if ((j * 7 + m * 13 + Math.floor(t / 30)) % 3 === 0) continue;
          liste.push(iso);
        }
      });
    }
    return liste;
  }
  // Avec l'origine de l'API (data-api, la configuration de recette) : les vrais créneaux,
  // lus chez gestion par tranches de 62 jours (contrat §2), sur la fenêtre la plus longue
  // des types (183 jours). Une tranche en panne : la page dit la panne.
  function lireChezGestion(suite) {
    var base = form.dataset.api.replace(/\/$/, '');
    var depart = midi(aujourdhui());
    var tranches = [];
    for (var n = 0; n < 4; n += 1) {
      var du = new Date(depart.getTime() + n * 62 * 86400000);
      var au = new Date(du.getTime() + 61 * 86400000);
      tranches.push([du.toISOString().slice(0, 10), au.toISOString().slice(0, 10)]);
    }
    Promise.all(tranches.map(function (t) {
      var adresse = base + '/v1/reservation/creneaux?type=' + encodeURIComponent(type) + '&du=' + t[0] + '&au=' + t[1];
      return fetch(adresse, { credentials: 'omit' }).then(function (r) { return r.status === 200 ? r.json() : null; });
    })).then(function (reponses) {
      if (reponses.some(function (r) { return !r || r.ok !== true; })) return suite(null);
      suite(reponses.reduce(function (tous, r) { return tous.concat(r.creneaux); }, []));
    }).catch(function () { suite(null); });
  }

  function lireLesCreneaux(suite) {
    if (form.dataset.api) return lireChezGestion(suite);
    setTimeout(function () {
      if (simuler === 'panne') return suite(null);
      suite(simuler === 'vide' ? [] : inventer());
    }, 500);
  }

  // ——— Ce que la personne avait déjà choisi, si la page a été rechargée ———
  // Lu tout de suite : le moteur d'écrans, en démarrant, réécrit le brouillon avec les
  // champs présents — et les heures n'y sont pas encore. Même règle que lui : on ne
  // reprend un brouillon qu'après un rechargement ou un retour par l'historique.
  var garde = (function () {
    var entree = (window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    if (entree.type !== 'reload' && entree.type !== 'back_forward') return {};
    try {
      var b = JSON.parse(sessionStorage.getItem('luminose_questionnaire:' + location.pathname) || 'null');
      return (b && b.reponses) || {};
    } catch (e) { return {}; }
  })();

  function creneauxDu(cleJour) {
    return creneaux.filter(function (iso) { return cleDuJour(iso) === cleJour; });
  }
  function heureCochee() {
    var radio = form.querySelector('input[name="debut"]:checked');
    return radio ? radio.value : '';
  }
  function decaler(cleMois, de) {
    var date = new Date(Date.UTC(+cleMois.slice(0, 4), +cleMois.slice(5, 7) - 1 + de, 1));
    return date.getUTCFullYear() + '-' + deux(date.getUTCMonth() + 1);
  }

  // ——— Le calendrier du mois ———
  function dessinerLeMois() {
    var annee = +mois.slice(0, 4), rang = +mois.slice(5, 7);
    libelleMois.textContent = majuscule(new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(annee, rang - 1, 1))));
    // On ne remonte pas avant le mois en cours, on ne dépasse pas le dernier créneau.
    boutonAvant.disabled = mois <= aujourdhui().slice(0, 7);
    boutonApres.disabled = !creneaux.length || mois >= creneaux[creneaux.length - 1].slice(0, 7);

    grille.textContent = '';
    // Les semaines commencent le lundi.
    var vides = (new Date(Date.UTC(annee, rang - 1, 1)).getUTCDay() + 6) % 7;
    for (var v = 0; v < vides; v += 1) grille.appendChild(document.createElement('span'));
    var dernier = new Date(Date.UTC(annee, rang, 0)).getUTCDate();
    var libres = 0;
    for (var j = 1; j <= dernier; j += 1) {
      var cle = mois + '-' + deux(j);
      var nombre = creneauxDu(cle).length;
      var caseJour;
      if (nombre) {
        libres += 1;
        caseJour = document.createElement('button');
        caseJour.type = 'button';
        caseJour.dataset.jour = cle;
        caseJour.setAttribute('aria-pressed', cle === jour ? 'true' : 'false');
        caseJour.setAttribute('aria-label', libelleJour(midi(cle)) + ', ' + nombre + (nombre > 1 ? ' créneaux libres' : ' créneau libre'));
      } else {
        // Un jour sans créneau n'est qu'un repère : il ne se lit pas, il ne se choisit pas.
        caseJour = document.createElement('span');
        caseJour.setAttribute('aria-hidden', 'true');
      }
      caseJour.className = 'res-cal-jour' + (cle === aujourdhui() ? ' est-aujourdhui' : '');
      caseJour.textContent = j;
      grille.appendChild(caseJour);
    }
    moisVide.hidden = libres > 0;
  }

  // ——— Les heures du jour choisi ———
  function dessinerLesHeures(aCocher) {
    Array.prototype.slice.call(listeHeures.children).forEach(function (enfant) {
      if (enfant !== erreurHeure) enfant.remove();
    });
    blocHeures.hidden = !jour;
    sansJour.hidden = !!jour;
    if (!jour) return ecrireLeRecapitulatif();
    jourChoisi.textContent = libelleJour(midi(jour));
    creneauxDu(jour).forEach(function (iso, i) {
      var ligne = document.createElement('div');
      ligne.className = 'res-heure';
      var radio = document.createElement('input');
      radio.className = 'is-sr-only';
      radio.type = 'radio';
      radio.name = 'debut';
      radio.id = 'rdv-heure-' + i;
      radio.value = iso;
      radio.checked = iso === aCocher;
      var etiquette = document.createElement('label');
      etiquette.className = 'button is-white is-purple-bordered res-heure-bouton';
      etiquette.htmlFor = radio.id;
      etiquette.textContent = libelleHeure(iso);
      // « Suivant » n'apparaît qu'à côté de l'heure choisie (feuille de style).
      var suivant = document.createElement('button');
      suivant.type = 'button';
      suivant.className = 'button is-primary res-heure-suivant';
      suivant.setAttribute('data-suivant', '');
      suivant.textContent = 'Suivant';
      ligne.appendChild(radio);
      ligne.appendChild(etiquette);
      ligne.appendChild(suivant);
      listeHeures.appendChild(ligne);
    });
    ecrireLeRecapitulatif();
  }

  function ecrireLeRecapitulatif() {
    var debut = heureCochee();
    recapQuand.textContent = debut ? libelleJour(new Date(debut), true) + ', à ' + libelleHeure(debut) : '';
  }

  // Sur téléphone, un seul des deux se voit : le calendrier (« jour ») ou les heures.
  function montrerLaVue(vue) {
    ecran.dataset.vue = vue === 'heure' && jour ? 'heure' : 'jour';
  }
  function choisirLeJour(cleJour, aCocher) {
    jour = cleJour;
    if (jour) mois = jour.slice(0, 7);
    dessinerLeMois();
    dessinerLesHeures(aCocher || '');
  }
  function direUneErreur(message) {
    erreurCreneau.textContent = message || '';
    erreurCreneau.hidden = !message;
  }

  function montrerLEtat(etat) {
    attente.hidden = etat !== 'attente';
    blocChoix.hidden = etat !== 'choix';
    blocVide.hidden = etat !== 'vide';
    blocPanne.hidden = etat !== 'panne';
    titre.textContent = etat === 'vide' || etat === 'panne' ? titre.dataset.titreSansCreneau : titre.dataset.titre;
    pret = etat === 'choix';
  }

  function charger() {
    montrerLEtat('attente');
    lireLesCreneaux(function (liste) {
      if (!liste) return montrerLEtat('panne');
      creneaux = liste;
      if (!creneaux.length) return montrerLEtat('vide');
      // Le calendrier s'ouvre sur le mois du premier créneau libre.
      mois = creneaux[0].slice(0, 7);
      var etat = history.state || {};
      if (garde.debut && creneaux.indexOf(garde.debut) >= 0) {
        // L'heure retenue avant le rechargement est toujours libre.
        choisirLeJour(cleDuJour(garde.debut), garde.debut);
        montrerLaVue('heure');
        // Le moteur a réécrit le brouillon sans elle : ce signal la lui fait reprendre.
        form.querySelector('input[name="debut"]:checked').dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        choisirLeJour(etat.jour && creneauxDu(etat.jour).length ? etat.jour : '');
        montrerLaVue(etat.vue);
        // Une heure avait été retenue, et elle n'est plus libre : on le dit là où l'on
        // choisit, pas trois écrans plus loin.
        if (garde.debut) {
          montrerLaVue('jour');
          direUneErreur('Le créneau que vous aviez choisi n\'est plus libre. Choisissez-en un autre.');
          form.dispatchEvent(new CustomEvent('res:aller', { detail: { ecran: 'creneau' } }));
        }
      }
      garde = {};
      montrerLEtat('choix');
    });
  }

  // Tant que les créneaux ne sont pas là, rien n'avance ; et rien ne part sans créneau.
  form.addEventListener('submit', function (e) {
    if (pret && heureCochee()) return;
    // Un jour est ouvert, sans heure choisie : le moteur le dira au-dessus des heures.
    if (pret && !ecran.hidden && jour) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!pret) return;
    montrerLaVue('jour');
    direUneErreur('Choisissez un jour, puis une heure.');
    form.dispatchEvent(new CustomEvent('res:aller', { detail: { ecran: 'creneau' } }));
  });

  form.addEventListener('click', function (e) {
    var caseJour = e.target.closest('[data-jour]');
    if (caseJour) {
      direUneErreur('');
      erreurHeure.textContent = erreurHeure.dataset.defaut;
      // Le même jour, rouvert, garde l'heure déjà choisie.
      choisirLeJour(caseJour.dataset.jour, caseJour.dataset.jour === jour ? heureCochee() : '');
      if (!coteACote.matches) {
        // Sur téléphone, les heures remplacent le calendrier : une entrée d'historique
        // de même rang que l'écran, pour que le retour du navigateur y ramène.
        history.pushState(Object.assign({}, history.state, { vue: 'heure', jour: jour }), '');
        montrerLaVue('heure');
        window.scrollTo(0, 0);
      }
      jourChoisi.focus({ preventScroll: coteACote.matches });
      return;
    }
    if (e.target.closest('[data-rdv-mois-precedent]')) { mois = decaler(mois, -1); dessinerLeMois(); }
    if (e.target.closest('[data-rdv-mois-suivant]')) { mois = decaler(mois, 1); dessinerLeMois(); }
    if (e.target.closest('[data-rdv-autre-jour]')) {
      if ((history.state || {}).vue === 'heure') history.back();
      else montrerLaVue('jour');
    }
    if (e.target.closest('[data-rdv-reessayer]')) {
      // MAQUETTE : un second essai aboutit.
      simuler = '';
      charger();
    }
  });

  // Le retour et l'avance du navigateur, entre le calendrier et les heures d'un jour.
  window.addEventListener('popstate', function (e) {
    if (!pret) return;
    var etat = e.state || {};
    if (etat.vue === 'heure' && etat.jour && etat.jour !== jour && creneauxDu(etat.jour).length) choisirLeJour(etat.jour);
    var avant = ecran.dataset.vue;
    montrerLaVue(etat.vue);
    // Revenu au calendrier : le regard — et le clavier — retrouvent le jour quitté.
    if (avant === 'heure' && ecran.dataset.vue === 'jour' && !ecran.hidden) {
      var quitte = grille.querySelector('[aria-pressed="true"]');
      if (quitte) quitte.focus({ preventScroll: true });
    }
  });

  form.addEventListener('change', function (e) {
    if (e.target.name !== 'debut') return;
    // Le message « ce créneau vient d'être pris » a fait son temps.
    erreurHeure.textContent = erreurHeure.dataset.defaut;
    direUneErreur('');
    ecrireLeRecapitulatif();
  });

  // Le créneau vient d'être pris par quelqu'un d'autre : il disparaît, et la personne
  // revient choisir — ses coordonnées restent en place.
  form.addEventListener('res:refus', function (e) {
    if (e.detail.motif !== 'creneau_pris') return;
    var pris = heureCochee();
    creneaux = creneaux.filter(function (iso) { return iso !== pris; });
    // MAQUETTE : le refus ne se produit qu'une fois.
    adresse.delete('simuler');
    history.replaceState(history.state, '', location.pathname + (adresse.toString() ? '?' + adresse : ''));
    var memeJour = cleDuJour(pris);
    if (creneauxDu(memeJour).length) {
      choisirLeJour(memeJour);
      erreurHeure.textContent = 'Ce créneau vient d\'être pris. Choisissez une autre heure.';
    } else {
      choisirLeJour('');
      direUneErreur('Ce créneau vient d\'être pris, et ce jour n\'a plus de place. Choisissez un autre jour.');
    }
    form.dispatchEvent(new CustomEvent('res:aller', { detail: { ecran: 'creneau' } }));
    montrerLaVue(jour ? 'heure' : 'jour');
  });

  // La réservation a abouti : la page suivante reçoit de quoi dire ce qui est réservé.
  // MAQUETTE : le questionnaire relit encore les paramètres que Calendly lui passait ;
  // à l'intégration, il recevra le jeton de la réponse de gestion après le « # », et
  // l'identité par l'onglet — plus rien de personnel dans l'adresse.
  form.addEventListener('res:envoye', function (e) {
    var suite = new URL(e.detail.suite, location.origin);
    // Réservée chez gestion : la référence du questionnaire de cette séance voyage après le #.
    if (form.dataset.reference) suite.hash = 'r=' + form.dataset.reference;
    suite.searchParams.set('event_start_time', heureCochee());
    suite.searchParams.set('type', type);
    if (form.dataset.transmettreIdentite === 'oui') {
      suite.searchParams.set('invitee_uuid', 'maquette-' + type);
      suite.searchParams.set('invitee_first_name', form.elements['identite[prenom]'].value.trim());
      suite.searchParams.set('invitee_last_name', form.elements['identite[nom]'].value.trim());
      suite.searchParams.set('invitee_email', form.elements['identite[email]'].value.trim());
      suite.searchParams.set('text_reminder_number', form.elements['identite[telephone]'].value.trim());
    }
    e.detail.suite = suite.pathname + suite.search + suite.hash;
  });

  // Les heures affichées sont celles de Paris : on ne le précise qu'à qui est ailleurs.
  try {
    fuseau.hidden = Intl.DateTimeFormat().resolvedOptions().timeZone === FUSEAU;
  } catch (e) { /* sans cette information, on ne dit rien */ }

  charger();
})();
