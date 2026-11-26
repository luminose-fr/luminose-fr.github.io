// Prendre un rendez-vous (_includes/reservation/rendez-vous.html) : les créneaux.
//
// Le moteur d'écrans est celui du questionnaire (js/reservation.js) : il vérifie, garde
// les réponses dans l'onglet, gère « Retour » et l'historique, et envoie. Ce script, chargé
// AVANT lui, n'apporte que ce qui est propre à la réservation : lire les créneaux libres,
// en faire des jours puis des heures à cocher, tenir le récapitulatif à jour, et dire quoi
// faire quand le créneau vient d'être pris.
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

  var attente = form.querySelector('[data-rdv-attente]');
  var blocJours = form.querySelector('[data-rdv-jours]');
  var blocVide = form.querySelector('[data-rdv-vide]');
  var blocPanne = form.querySelector('[data-rdv-panne]');
  var listeJours = form.querySelector('[data-rdv-liste-jours]');
  var listeHeures = form.querySelector('[data-rdv-liste-heures]');
  var boutonPlus = form.querySelector('[data-rdv-plus]');
  var erreurHeure = form.querySelector('[data-rdv-erreur-heure]');
  var erreurJour = listeJours.querySelector('.res-erreur');
  var jourChoisi = form.querySelector('[data-rdv-jour-choisi]');
  var recapQuand = form.querySelector('[data-rdv-recap-quand]');
  var fuseau = form.querySelector('[data-rdv-fuseau]');
  var titre = form.querySelector('[data-rdv-titre]');

  // Combien de jours on montre d'un coup : assez pour choisir, pas assez pour s'y perdre.
  var PAR_PAGE = 6;
  var joursMontres = PAR_PAGE;
  var creneaux = [];   // débuts libres, en texte ISO avec décalage
  var pret = false;

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
  function cleDuJour(iso) { return iso.slice(0, 10); }
  function libelleJour(iso, avecAnnee) {
    var options = { weekday: 'long', day: 'numeric', month: 'long', timeZone: FUSEAU };
    if (avecAnnee) options.year = 'numeric';
    var texte = new Intl.DateTimeFormat('fr-FR', options).format(new Date(iso));
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }
  function libelleHeure(iso) {
    var p = parties(new Date(iso));
    return Number(p.hour) + ' h' + (p.minute !== '00' ? ' ' + p.minute : '');
  }
  function minutesDe(iso) {
    var p = parties(new Date(iso));
    return Number(p.hour) * 60 + Number(p.minute);
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

  function deux(n) { return (n < 10 ? '0' : '') + n; }
  function isoParis(a, m, j, minutes) {
    // Le décalage de Paris ce jour-là (heure d'été ou d'hiver), lu sur midi.
    var midi = new Date(Date.UTC(a, m - 1, j, 12));
    var p = parties(midi);
    var decalage = Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - midi.getTime()) / 60000);
    var signe = decalage >= 0 ? '+' : '-';
    var d = Math.abs(decalage);
    return a + '-' + deux(m) + '-' + deux(j) + 'T' + deux(Math.floor(minutes / 60)) + ':' + deux(minutes % 60) + ':00' +
      signe + deux(Math.floor(d / 60)) + ':' + deux(d % 60);
  }
  function inventer() {
    var regle = TYPES[type] || TYPES.seance;
    var maintenant = Date.now();
    var ouverture = maintenant + regle.debutH * 3600000;
    var fermeture = maintenant + regle.finH * 3600000;
    var aujourdhui = parties(new Date(maintenant));
    var liste = [];
    for (var n = 0; n <= 190; n += 1) {
      var jour = new Date(Date.UTC(+aujourdhui.year, +aujourdhui.month - 1, +aujourdhui.day + n));
      if (JOURS_OUVERTS.indexOf(jour.getUTCDay()) < 0) continue;
      var a = jour.getUTCFullYear(), m = jour.getUTCMonth() + 1, j = jour.getUTCDate();
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
  function lireLesCreneaux(suite) {
    setTimeout(function () {
      if (simuler === 'panne') return suite(null);
      suite(simuler === 'vide' ? [] : inventer());
    }, 500);
  }

  // ——— Ce que la personne avait déjà coché, si la page a été rechargée ———
  // Lu tout de suite : le moteur d'écrans, en démarrant, réécrit le brouillon avec les
  // champs présents — et les jours n'y sont pas encore. Même règle que lui : on ne
  // reprend un brouillon qu'après un rechargement ou un retour par l'historique.
  var garde = (function () {
    var entree = (window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    if (entree.type !== 'reload' && entree.type !== 'back_forward') return {};
    try {
      var b = JSON.parse(sessionStorage.getItem('luminose_questionnaire:' + location.pathname) || 'null');
      return (b && b.reponses) || {};
    } catch (e) { return {}; }
  })();

  // ——— Les jours ———
  function jours() {
    var vus = {};
    return creneaux.map(cleDuJour).filter(function (cle) {
      if (vus[cle]) return false;
      vus[cle] = true;
      return true;
    });
  }
  function creneauxDu(jour) {
    return creneaux.filter(function (iso) { return cleDuJour(iso) === jour; });
  }
  function option(nom, id, valeur, libelle, detail) {
    var bloc = document.createElement('div');
    bloc.className = 'res-choix-option';
    var radio = document.createElement('input');
    radio.className = 'is-checkradio';
    radio.type = 'radio';
    radio.name = nom;
    radio.id = id;
    radio.value = valeur;
    var etiquette = document.createElement('label');
    etiquette.htmlFor = id;
    etiquette.textContent = libelle;
    if (detail) {
      var precision = document.createElement('span');
      precision.className = 'res-choix-detail';
      precision.textContent = detail;
      etiquette.appendChild(precision);
    }
    bloc.appendChild(radio);
    bloc.appendChild(etiquette);
    return bloc;
  }
  function jourCoche() {
    var radio = form.querySelector('input[name="jour"]:checked');
    return radio ? radio.value : '';
  }
  function heureCochee() {
    var radio = form.querySelector('input[name="debut"]:checked');
    return radio ? radio.value : '';
  }

  function dessinerLesJours(aCocher) {
    var coche = aCocher || jourCoche();
    var tous = jours();
    // Un jour déjà choisi plus loin dans la liste reste visible.
    var rang = tous.indexOf(coche);
    if (rang >= joursMontres) joursMontres = (Math.floor(rang / PAR_PAGE) + 1) * PAR_PAGE;
    var message = listeJours.querySelector('.res-erreur');
    Array.prototype.slice.call(listeJours.querySelectorAll('.res-choix-option')).forEach(function (o) { o.remove(); });
    tous.slice(0, joursMontres).forEach(function (jour, i) {
      var nombre = creneauxDu(jour).length;
      var bloc = option('jour', 'rdv-jour-' + i, jour, libelleJour(jour + 'T12:00:00Z'), nombre + (nombre > 1 ? ' créneaux libres' : ' créneau libre'));
      if (jour === coche) bloc.querySelector('input').checked = true;
      listeJours.insertBefore(bloc, message);
    });
    boutonPlus.parentNode.hidden = joursMontres >= tous.length;
  }

  // ——— Les heures du jour choisi ———
  function dessinerLesHeures(aCocher) {
    var jour = jourCoche();
    var message = erreurHeure;
    Array.prototype.slice.call(listeHeures.children).forEach(function (enfant) {
      if (enfant !== message) enfant.remove();
    });
    if (!jour) return;
    jourChoisi.textContent = libelleJour(jour + 'T12:00:00Z');
    var libres = creneauxDu(jour);
    // Au-delà de huit créneaux, on les range par moment de la journée (en minutes
    // depuis minuit : la fin de journée commence à 16 h 30, avec la dernière plage).
    var moments = libres.length > 8
      ? [['Le matin', function (m) { return m < 720; }], ['L\'après-midi', function (m) { return m >= 720 && m < 990; }], ['En fin de journée', function (m) { return m >= 990; }]]
      : [['', function () { return true; }]];
    var n = 0;
    moments.forEach(function (moment) {
      var duMoment = libres.filter(function (iso) { return moment[1](minutesDe(iso)); });
      if (!duMoment.length) return;
      if (moment[0]) {
        var titre = document.createElement('p');
        titre.className = 'res-heures-moment';
        titre.textContent = moment[0];
        listeHeures.insertBefore(titre, message);
      }
      var grille = document.createElement('div');
      grille.className = 'res-choix res-choix-grille';
      duMoment.forEach(function (iso) {
        n += 1;
        var bloc = option('debut', 'rdv-heure-' + n, iso, libelleHeure(iso));
        if (iso === aCocher) bloc.querySelector('input').checked = true;
        grille.appendChild(bloc);
      });
      listeHeures.insertBefore(grille, message);
    });
    ecrireLeRecapitulatif();
  }

  function ecrireLeRecapitulatif() {
    var debut = heureCochee();
    recapQuand.textContent = debut ? libelleJour(debut, true) + ', à ' + libelleHeure(debut) : '';
  }

  function montrerLEtat(etat) {
    attente.hidden = etat !== 'attente';
    blocJours.hidden = etat !== 'jours';
    blocVide.hidden = etat !== 'vide';
    blocPanne.hidden = etat !== 'panne';
    titre.textContent = etat === 'vide' || etat === 'panne' ? titre.dataset.titreSansCreneau : titre.dataset.titre;
    pret = etat === 'jours';
  }

  function charger() {
    montrerLEtat('attente');
    lireLesCreneaux(function (liste) {
      if (!liste) return montrerLEtat('panne');
      creneaux = liste;
      if (!creneaux.length) return montrerLEtat('vide');
      // Un jour ou une heure retenus avant le rechargement, s'ils sont toujours libres.
      var jour = jours().indexOf(garde.jour) >= 0 ? garde.jour : '';
      dessinerLesJours(jour);
      dessinerLesHeures(creneaux.indexOf(garde.debut) >= 0 ? garde.debut : '');
      garde = {};
      montrerLEtat('jours');
    });
  }

  // Tant que les créneaux ne sont pas là, la touche Entrée ne fait rien avancer.
  form.addEventListener('submit', function (e) {
    if (pret) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  });

  form.addEventListener('change', function (e) {
    if (e.target.name === 'jour') {
      erreurJour.textContent = erreurJour.dataset.defaut;
      erreurHeure.textContent = erreurHeure.dataset.defaut;
      dessinerLesHeures('');
    }
    if (e.target.name === 'debut') {
      // Le message « ce créneau vient d'être pris » a fait son temps.
      erreurHeure.textContent = erreurHeure.dataset.defaut;
      ecrireLeRecapitulatif();
    }
  });

  boutonPlus.addEventListener('click', function () {
    var avant = joursMontres;
    joursMontres += PAR_PAGE;
    dessinerLesJours();
    // Le clavier et les lecteurs d'écran arrivent sur la première date ajoutée.
    var premiere = listeJours.querySelectorAll('input[name="jour"]')[avant];
    if (premiere) premiere.focus();
  });

  form.querySelector('[data-rdv-reessayer]').addEventListener('click', function () {
    // MAQUETTE : un second essai aboutit.
    simuler = '';
    charger();
  });

  // Le créneau vient d'être pris par quelqu'un d'autre : il disparaît de la liste, et la
  // personne revient choisir une heure — ses coordonnées restent en place.
  form.addEventListener('res:refus', function (e) {
    if (e.detail.motif !== 'creneau_pris') return;
    var pris = heureCochee();
    creneaux = creneaux.filter(function (iso) { return iso !== pris; });
    // MAQUETTE : le refus ne se produit qu'une fois.
    adresse.delete('simuler');
    history.replaceState(history.state, '', location.pathname + (adresse.toString() ? '?' + adresse : ''));
    var jour = cleDuJour(pris);
    var resteCeJour = creneauxDu(jour).length > 0;
    dessinerLesJours(resteCeJour ? jour : '');
    dessinerLesHeures('');
    if (resteCeJour) erreurHeure.textContent = 'Ce créneau vient d\'être pris. Choisissez une autre heure.';
    else erreurJour.textContent = 'Ce créneau vient d\'être pris, et ce jour n\'a plus de place. Choisissez un autre jour.';
  });

  // La réservation a abouti : la page suivante reçoit de quoi dire ce qui est réservé.
  // MAQUETTE : le questionnaire relit encore les paramètres que Calendly lui passait ;
  // à l'intégration, il recevra le jeton de la réponse de gestion après le « # », et
  // l'identité par l'onglet — plus rien de personnel dans l'adresse.
  form.addEventListener('res:envoye', function (e) {
    var suite = new URL(e.detail.suite, location.origin);
    var debut = heureCochee();
    suite.searchParams.set('event_start_time', debut);
    suite.searchParams.set('type', type);
    if (form.dataset.transmettreIdentite === 'oui') {
      suite.searchParams.set('invitee_uuid', 'maquette-' + type);
      suite.searchParams.set('invitee_first_name', form.elements['identite[prenom]'].value.trim());
      suite.searchParams.set('invitee_last_name', form.elements['identite[nom]'].value.trim());
      suite.searchParams.set('invitee_email', form.elements['identite[email]'].value.trim());
      suite.searchParams.set('text_reminder_number', form.elements['identite[telephone]'].value.trim());
    }
    e.detail.suite = suite.pathname + suite.search;
  });

  // Les heures affichées sont celles de Paris : on ne le précise qu'à qui est ailleurs.
  try {
    fuseau.hidden = Intl.DateTimeFormat().resolvedOptions().timeZone === FUSEAU;
  } catch (e) { /* sans cette information, on ne dit rien */ }

  charger();
})();
