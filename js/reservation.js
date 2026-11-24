// Questionnaire de santé, un sujet par écran (_includes/reservation/questionnaire.html).
//
// Rien de ce que la personne répond ne quitte la page avant l'envoi, ni ne reste dans
// le navigateur : pas de sessionStorage pour les réponses de santé. Seuls sont lus :
// - les coordonnées que Calendly transmet en redirigeant (rangées par head.html) ;
// - la date de la réservation (event_start_time), qui n'a rien de personnel.
(function () {
  'use strict';

  var form = document.querySelector('[data-questionnaire]');
  if (!form) return;

  var ecrans = Array.prototype.slice.call(form.querySelectorAll('[data-ecran]'));
  var avancement = document.querySelector('[data-avancement]');
  var annonce = form.querySelector('[data-annonce]');
  var sansMouvement = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUREE = sansMouvement ? 0 : 180;
  var courant = null;
  var enTransition = false;

  // --- Ce que la page reçoit ---
  var parametres = {};
  try {
    parametres = JSON.parse(sessionStorage.getItem('luminose_parametres:' + location.pathname) || '{}') || {};
  } catch (e) { parametres = {}; }
  Object.assign(parametres, window.luminoseParametres || {});
  var adresse = new URLSearchParams(location.search);

  // --- La date réservée, en toutes lettres, sur le premier écran seulement ---
  var debut = adresse.get('event_start_time');
  var champDate = form.querySelector('[data-reservation-date]');
  if (debut && champDate) {
    var date = new Date(debut);
    if (!isNaN(date)) {
      var jour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(date);
      var heures = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'Europe/Paris' }).format(date).split(':');
      var heure = Number(heures[0]) + ' h' + (heures[1] !== '00' ? ' ' + heures[1] : '');
      champDate.textContent = jour.charAt(0).toUpperCase() + jour.slice(1) + ', à ' + heure;
      champDate.hidden = false;
    }
  }

  // --- Vérification, à l'endroit où l'erreur se corrige ---
  var formats = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    date: /^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(19|20)\d\d$/
  };

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

  function verifier(ecran) {
    var premier = null;
    ecran.querySelectorAll('[data-requis]').forEach(function (bloc) {
      if (bloc.closest('[hidden]')) return;
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
  function effacer(e) {
    var bloc = e.target.closest('[data-requis]');
    if (bloc && bloc.classList.contains('est-en-erreur') && blocValide(bloc)) bloc.classList.remove('est-en-erreur');
  }
  form.addEventListener('input', effacer);
  form.addEventListener('change', effacer);

  // --- Les coordonnées venues de Calendly ne sont pas redemandées ---
  // Seules celles qui manquent (le téléphone, si la personne n'a pas voulu de SMS) ou
  // qui sont invalides restent à l'écran « identite » ; s'il n'en reste aucune, il saute.
  var correspondances = {
    prenom: 'invitee_first_name',
    nom: 'invitee_last_name',
    email: 'invitee_email',
    telephone: 'text_reminder_number'
  };
  var identite = form.querySelector('[data-ecran="identite"]');
  if (identite) {
    var manquantes = 0;
    Object.keys(correspondances).forEach(function (cle) {
      var bloc = identite.querySelector('[data-identite="' + cle + '"]');
      var valeur = parametres[correspondances[cle]];
      if (valeur) bloc.querySelector('input').value = valeur;
      if (valeur && blocValide(bloc)) bloc.hidden = true;
      else manquantes += 1;
    });
    if (!manquantes) identite.dataset.inactif = '';
  }

  // --- La version, et la suite d'écrans qui en découle ---
  function version() {
    if (form.dataset.versionFixe) return form.dataset.versionFixe;
    var choix = form.querySelector('input[name="version"]:checked');
    return choix ? choix.value : '';
  }

  function miseAJour() {
    var choix = form.querySelector('input[name="coordonnees_reprises"]:checked');
    return !!choix && choix.value === 'mettre-a-jour';
  }

  function estActif(ecran) {
    var v = version();
    if ('inactif' in ecran.dataset) return false;
    if (ecran.dataset.version && ecran.dataset.version !== v) return false;
    if ('siCoordonnees' in ecran.dataset) return v === 'complet' || (v === 'suivi' && miseAJour());
    return true;
  }

  function actifs() {
    return ecrans.filter(estActif);
  }

  // Une question d'une autre version, ou un écran hors de la suite, n'est ni vérifié
  // ni envoyé.
  function appliquerVersion() {
    var v = version();
    form.querySelectorAll('[data-version]').forEach(function (el) {
      var visible = el.dataset.version === v;
      if (!el.hasAttribute('data-ecran')) el.hidden = !visible;
      el.querySelectorAll('input, select, textarea').forEach(function (champ) { champ.disabled = !visible; });
    });
    form.querySelectorAll('[data-si-coordonnees]').forEach(function (el) {
      var actif = estActif(el);
      el.querySelectorAll('input, select, textarea').forEach(function (champ) { champ.disabled = !actif; });
    });
    mesurer();
  }
  form.querySelectorAll('input[name="version"], input[name="coordonnees_reprises"]').forEach(function (radio) {
    radio.addEventListener('change', appliquerVersion);
  });

  // --- L'avancement : le segment de l'étape en cours, dans la barre du parcours ---
  function mesurer() {
    if (!courant) return;
    var suite = actifs();
    var rang = suite.indexOf(courant);
    if (avancement) avancement.style.width = Math.round(((rang + 1) / (suite.length + 1)) * 100) + '%';
    if (annonce) annonce.textContent = 'Écran ' + (rang + 1) + ' sur ' + suite.length;
  }

  // --- Passer d'un écran à l'autre : il glisse dans le sens de la marche ---
  function montrer(cible, sens, sansEffet) {
    if (!cible || cible === courant) return;
    var sortant = courant;
    courant = cible;
    enTransition = true;

    function entrer() {
      if (sortant) {
        sortant.hidden = true;
        sortant.classList.remove('est-hors-champ');
      }
      cible.style.setProperty('--res-decalage', (sens >= 0 ? 12 : -12) + 'px');
      if (!sansEffet) cible.classList.add('est-hors-champ');
      cible.hidden = false;
      window.scrollTo(0, 0);
      mesurer();
      // Deux images : la première pose l'état de départ, la seconde lance la transition.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cible.classList.remove('est-hors-champ');
          enTransition = false;
          var titre = cible.querySelector('h1');
          if (titre && !sansEffet) titre.focus({ preventScroll: true });
        });
      });
    }

    if (sortant && !sansEffet && DUREE) {
      sortant.style.setProperty('--res-decalage', (sens >= 0 ? -12 : 12) + 'px');
      sortant.classList.add('est-hors-champ');
      setTimeout(entrer, DUREE);
    } else {
      entrer();
    }
  }

  function parNom(nom) {
    return ecrans.filter(function (e) { return e.dataset.ecran === nom && estActif(e); })[0] || null;
  }

  function avancer() {
    if (enTransition || !verifier(courant)) return;
    var suite = actifs();
    var suivant = suite[suite.indexOf(courant) + 1];
    if (!suivant) {
      // Maquette : rien n'est envoyé.
      if (form.dataset.suite) location.href = form.dataset.suite;
      return;
    }
    // Chaque écran entre dans l'historique : le bouton et le geste « retour » du
    // navigateur reviennent à l'écran précédent, sans quitter la page ni rien perdre.
    history.pushState({ ecran: suivant.dataset.ecran }, '');
    montrer(suivant, 1);
  }

  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-suivant]')) avancer();
    if (e.target.closest('[data-precedent]') && !enTransition) history.back();
  });

  // Entrée dans un champ, ou le bouton d'envoi du dernier écran.
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    avancer();
  });

  window.addEventListener('popstate', function (e) {
    var cible = parNom(e.state && e.state.ecran) || actifs()[0];
    var suite = actifs();
    montrer(cible, suite.indexOf(cible) < suite.indexOf(courant) ? -1 : 1);
  });

  // --- Départ ---
  ecrans.forEach(function (ecran) { ecran.hidden = true; });
  appliquerVersion();
  var premier = actifs()[0];
  history.replaceState({ ecran: premier.dataset.ecran }, '');
  montrer(premier, 1, true);
})();
