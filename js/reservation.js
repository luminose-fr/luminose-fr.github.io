// Questionnaire de santé en étapes (_includes/reservation/questionnaire.html).
//
// Rien de ce que la personne répond ne quitte la page avant l'envoi, ni ne reste dans
// le navigateur : pas de sessionStorage pour les réponses de santé. Seuls sont lus :
// - la version choisie dans la modale de réservation (« premiere » ou « suivi ») ;
// - les coordonnées que Calendly transmet en redirigeant (rangées par head.html) ;
// - la date de la réservation (event_start_time), qui n'a rien de personnel.
(function () {
  'use strict';

  var form = document.querySelector('[data-questionnaire]');
  if (!form) return;

  var etapes = Array.prototype.slice.call(form.querySelectorAll('[data-etape]'));
  var courante = 0;

  // --- Ce que la page reçoit ---
  var parametres = {};
  try {
    parametres = JSON.parse(sessionStorage.getItem('luminose_parametres:' + location.pathname) || '{}') || {};
  } catch (e) { parametres = {}; }
  Object.assign(parametres, window.luminoseParametres || {});
  var adresse = new URLSearchParams(location.search);

  // --- La date réservée, en toutes lettres ---
  var debut = adresse.get('event_start_time');
  var champDate = document.querySelector('[data-reservation-date]');
  if (debut && champDate) {
    var date = new Date(debut);
    if (!isNaN(date)) {
      var jour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(date);
      var heures = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'Europe/Paris' }).format(date).split(':');
      var heure = Number(heures[0]) + ' h' + (heures[1] !== '00' ? ' ' + heures[1] : '');
      champDate.textContent = jour.charAt(0).toUpperCase() + jour.slice(1) + ', à ' + heure;
    }
  }

  // --- Les coordonnées venues de Calendly : un résumé, et les champs restent modifiables ---
  var correspondances = {
    prenom: 'invitee_first_name',
    nom: 'invitee_last_name',
    email: 'invitee_email',
    telephone: 'text_reminder_number'
  };
  var resume = form.querySelector('[data-resume]');
  var connus = [];
  Object.keys(correspondances).forEach(function (cle) {
    var valeur = parametres[correspondances[cle]];
    var bloc = form.querySelector('[data-identite="' + cle + '"]');
    if (!bloc || !valeur) return;
    bloc.querySelector('input').value = valeur;
    connus.push(bloc);
  });
  if (resume && connus.length) {
    // textContent, jamais innerHTML : ces valeurs viennent de l'adresse.
    resume.querySelector('[data-resume-nom]').textContent = [parametres.invitee_first_name, parametres.invitee_last_name].filter(Boolean).join(' ');
    resume.querySelector('[data-resume-email]').textContent = parametres.invitee_email || '';
    resume.querySelector('[data-resume-telephone]').textContent = parametres.text_reminder_number || '';
    connus.forEach(function (bloc) { bloc.hidden = true; });
    resume.hidden = false;
    resume.querySelector('[data-resume-modifier]').addEventListener('click', function () {
      connus.forEach(function (bloc) { bloc.hidden = false; });
      resume.hidden = true;
      connus[0].querySelector('input').focus();
    });
  }

  // --- La version : complète ou de suivi ---
  var apresVersion = form.querySelector('[data-apres-version]');
  var choix = form.querySelector('[data-choix-version]');
  // Après une séance réservée, la question précède les étapes : elles n'apparaissent
  // qu'une fois la version connue. Pour un groupe, elle fait partie de la première étape.
  var choixHorsEtapes = !!(choix && apresVersion && !apresVersion.contains(choix));

  function appliquerVersion(version) {
    form.dataset.version = version || '';
    form.querySelectorAll('[data-version]').forEach(function (el) {
      var visible = el.dataset.version === version;
      el.hidden = !visible;
      el.querySelectorAll('input, select, textarea').forEach(function (champ) {
        // Une question cachée n'est ni vérifiée ni envoyée.
        champ.disabled = !visible || !!champ.closest('[data-si-mise-a-jour][hidden]');
      });
    });
    if (choixHorsEtapes) apresVersion.hidden = !version;
    afficher(courante, false);
  }

  var versionFixe = form.dataset.versionFixe;
  var versionDepart = '';
  if (versionFixe) {
    versionDepart = versionFixe;
  } else {
    var dansAdresse = adresse.get('version');
    var dansModale = '';
    try { dansModale = sessionStorage.getItem('luminose_breathwork') || ''; } catch (e) { dansModale = ''; }
    // Un lien qui précise la version l'emporte sur la modale, même pour dire « inconnue ».
    if (adresse.has('version')) versionDepart = (dansAdresse === 'complet' || dansAdresse === 'suivi') ? dansAdresse : '';
    else if (dansModale === 'premiere') versionDepart = 'complet';
    else if (dansModale === 'suivi') versionDepart = 'suivi';
    if (versionDepart) {
      form.querySelectorAll('input[name="version"]').forEach(function (r) { r.checked = r.value === versionDepart; });
    }
  }
  form.querySelectorAll('input[name="version"]').forEach(function (radio) {
    radio.addEventListener('change', function () { appliquerVersion(radio.value); });
  });

  // « Mettre à jour ces informations » ouvre les champs, vides : rien du questionnaire
  // précédent n'est jamais affiché.
  form.querySelectorAll('input[name="coordonnees_reprises"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      var bloc = form.querySelector('[data-si-mise-a-jour]');
      bloc.hidden = radio.value !== 'mettre-a-jour';
      bloc.querySelectorAll('input, select, textarea').forEach(function (champ) { champ.disabled = bloc.hidden; });
    });
  });

  // --- Les étapes ---
  var progression = form.querySelector('[data-progression]');
  var barre = form.querySelector('[data-progression-barre]');

  function afficher(index, deplacer) {
    courante = index;
    etapes.forEach(function (etape, i) { etape.hidden = i !== index; });
    // Le choix de version ne reste visible qu'au début.
    if (choixHorsEtapes) choix.hidden = index > 0;
    if (progression && etapes.length > 1) {
      // « Partie » et non « Étape » : les parcours ont déjà leurs étapes (rendez-vous, paiement…).
      progression.textContent = 'Partie ' + (index + 1) + ' sur ' + etapes.length;
      barre.innerHTML = '';
      etapes.forEach(function (_, i) {
        var trait = document.createElement('span');
        if (i <= index) trait.className = 'est-faite';
        barre.appendChild(trait);
      });
    } else if (progression) {
      progression.hidden = true;
      barre.hidden = true;
    }
    if (deplacer) {
      var haut = form.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top: haut, behavior: 'auto' });
      var titre = etapes[index].querySelector('.res-etape-titre');
      if (titre) titre.focus({ preventScroll: true });
    }
  }

  // --- Vérification, étape par étape, à l'endroit où l'erreur se corrige ---
  var formats = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    date: /^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(19|20)\d\d$/
  };

  function estVisible(el) {
    return !el.closest('[hidden]');
  }

  function blocValide(bloc) {
    var champs = Array.prototype.slice.call(bloc.querySelectorAll('input, select, textarea')).filter(function (c) { return !c.disabled; });
    if (!champs.length) return true;
    if (champs[0].type === 'radio') return champs.some(function (c) { return c.checked; });
    if (champs[0].type === 'checkbox') return champs[0].checked;
    var valeur = champs[0].value.trim();
    if (!valeur) return false;
    var format = champs[0].dataset.format;
    return !format || formats[format].test(valeur);
  }

  function verifier(zone) {
    var premier = null;
    zone.querySelectorAll('[data-requis]').forEach(function (bloc) {
      if (!estVisible(bloc)) return;
      var ok = blocValide(bloc);
      bloc.classList.toggle('est-en-erreur', !ok);
      if (!ok && !premier) premier = bloc;
    });
    if (premier) {
      premier.scrollIntoView({ block: 'center' });
      var champ = premier.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (champ) champ.focus({ preventScroll: true });
    }
    return !premier;
  }

  // L'erreur disparaît dès que la réponse est donnée.
  form.addEventListener('input', effacer);
  form.addEventListener('change', effacer);
  function effacer(e) {
    var bloc = e.target.closest('[data-requis]');
    if (bloc && bloc.classList.contains('est-en-erreur') && blocValide(bloc)) bloc.classList.remove('est-en-erreur');
  }

  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-suivant]') && verifier(etapes[courante])) {
      afficher(courante + 1, true);
    }
    if (e.target.closest('[data-precedent]')) {
      afficher(Math.max(0, courante - 1), true);
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!verifier(etapes[courante])) return;
    // Entrée dans un champ, avant la dernière étape : on passe à la suivante.
    if (courante < etapes.length - 1) { afficher(courante + 1, true); return; }
    // Maquette : rien n'est envoyé.
    if (form.dataset.suite) location.href = form.dataset.suite;
  });

  // Une coordonnée transmise mais invalide (e-mail mal saisi dans Calendly) reste visible.
  connus.forEach(function (bloc) {
    if (!blocValide(bloc)) { bloc.hidden = false; if (resume) resume.hidden = true; }
  });

  appliquerVersion(versionDepart);
  afficher(0, false);
})();
