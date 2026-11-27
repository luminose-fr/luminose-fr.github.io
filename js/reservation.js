// Questionnaire de santé, un sujet par écran (_includes/reservation/questionnaire.html).
//
// Ce que la page reçoit :
// - de Calendly, en redirigeant : l'identifiant de la réservation (invitee_uuid), le
//   prénom, le nom, l'e-mail, le téléphone des rappels — retirés de l'adresse par
//   head.html, lus ici dans window.luminoseParametres, à l'arrivée seulement ;
// - d'un e-mail de rappel : l'identifiant de la réservation et la date, rien d'autre ;
// - de la page d'un évènement : son identifiant (notion_page_id) ;
// - la date de la réservation (event_start_time), qui reste dans l'adresse.
//
// Ce qu'elle garde : les réponses, dans l'onglet (sessionStorage), le temps de la
// saisie — un téléphone recharge volontiers une page quittée un instant pour chercher
// un numéro. Elles sont effacées à l'envoi, et à toute nouvelle arrivée qui n'est pas
// la même réservation : une personne ne retrouve jamais les réponses ni l'identité
// d'une autre. Rien n'est écrit ailleurs (décision du 24/11/2026).
(function () {
  'use strict';

  var form = document.querySelector('[data-questionnaire]');
  if (!form) return;

  function tous(selecteur, racine) {
    return Array.prototype.slice.call((racine || form).querySelectorAll(selecteur));
  }

  var contexte = form.dataset.contexte || 'seance';
  var ecrans = tous('[data-ecran]');
  var avancement = document.querySelector('[data-avancement]');
  var annonce = form.querySelector('[data-annonce]');
  var sansMouvement = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUREE = sansMouvement ? 0 : 180;
  var courant = null;
  var enTransition = false;
  var minuterie = null;
  var enEnvoi = false;
  var envoye = false;

  // ——— Ce qui reste dans l'onglet pendant la saisie ———
  var CLE = 'luminose_questionnaire:' + location.pathname;
  function lire() {
    try { return JSON.parse(sessionStorage.getItem(CLE) || 'null'); } catch (e) { return null; }
  }
  function oublier() {
    try { sessionStorage.removeItem(CLE); } catch (e) { /* sans stockage, rien à effacer */ }
  }

  // ——— Qui arrive, et d'où ———
  var recus = window.luminoseParametres || {};
  var adresse = new URLSearchParams(location.search);
  // Le lien d'un questionnaire (envoyé par gestion) porte sa référence après le # :
  // lue une fois, retirée aussitôt de l'adresse et de l'historique, gardée en mémoire
  // seulement — jamais dans le stockage de l'onglet (gestion, §14.5).
  var reference = null;
  var marque = /^#(?:r=)?([A-Za-z0-9._-]{1,512})$/.exec(location.hash);
  if (marque) {
    reference = marque[1];
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* l'adresse garde le jeton ; il ne part nulle part ailleurs */ }
  }
  var entree = (window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
  // Rechargement, ou retour par l'historique : c'est la même personne, sur la même page.
  var retourSurLaPage = entree.type === 'reload' || entree.type === 'back_forward';
  var arrivee = {
    uuid: recus.invitee_uuid || '',
    prenom: recus.invitee_first_name || '',
    nom: recus.invitee_last_name || '',
    email: recus.invitee_email || '',
    telephone: recus.text_reminder_number || '',
    journee: recus.notion_page_id || ''
  };
  var arriveAvecDesDonnees = Object.keys(arrivee).some(function (cle) { return arrivee[cle]; });
  var brouillon = lire();
  var reservation;
  if (arriveAvecDesDonnees) {
    // La même réservation rouverte garde son brouillon ; toute autre arrivée repart de zéro.
    if (brouillon && brouillon.reservation && arrivee.uuid && brouillon.reservation.uuid === arrivee.uuid) {
      reservation = brouillon.reservation;
    } else {
      brouillon = null;
      reservation = arrivee;
    }
  } else if (retourSurLaPage && brouillon) {
    reservation = brouillon.reservation || arrivee;
  } else {
    // Une arrivée sans rien (lien nu, adresse tapée) ne reprend jamais ce qu'une
    // réservation précédente a laissé dans l'onglet.
    brouillon = null;
    reservation = arrivee;
  }
  if (!brouillon) {
    oublier();
    // Le navigateur peut avoir remis de lui-même d'anciennes valeurs dans les champs
    // (retour par l'historique après un envoi) : sans brouillon, on repart de rien.
    form.reset();
  }

  function nouvelIdentifiant() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'e-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  // Un identifiant par envoi : un double appui ou une relance ne crée pas deux questionnaires.
  var envoiId = (brouillon && brouillon.envoiId) || nouvelIdentifiant();

  // Ce que la réservation apporte au formulaire : rejoué après toute remise à zéro.
  function poserLaReservation() {
    if (form.elements.envoi_id) form.elements.envoi_id.value = envoiId;
    if (form.elements.invitee_uuid) form.elements.invitee_uuid.value = reservation.uuid;
    if (contexte === 'seance' || contexte === 'decouverte') {
      ['prenom', 'nom', 'email', 'telephone'].forEach(function (cle) {
        var champ = form.querySelector('[data-identite="' + cle + '"] input');
        if (champ && reservation[cle]) champ.value = reservation[cle];
      });
    }
    tous('input[name="notion_page_id"][type="radio"]').forEach(function (radio) {
      if (reservation.journee && radio.value === reservation.journee) radio.checked = true;
    });
  }
  poserLaReservation();

  // ——— Les réponses déjà données, si la page a été rechargée ———
  function cleDe(champ) {
    return champ.name || (champ.dataset.datePartie ? 'date:' + champ.id : '');
  }
  function champsARetenir() {
    return tous('input, select, textarea').filter(function (c) { return c.type !== 'hidden' && cleDe(c); });
  }
  if (brouillon && brouillon.reponses) {
    champsARetenir().forEach(function (c) {
      var cle = cleDe(c);
      if (!(cle in brouillon.reponses)) return;
      if (c.type === 'radio') c.checked = brouillon.reponses[cle] === c.value;
      else if (c.type === 'checkbox') c.checked = !!brouillon.reponses[cle];
      else c.value = brouillon.reponses[cle];
    });
  }

  var enregistrementPrevu = null;
  function enregistrer() {
    if (envoye) return;
    var reponses = {};
    champsARetenir().forEach(function (c) {
      if (c.type === 'radio') { if (c.checked) reponses[cleDe(c)] = c.value; }
      else if (c.type === 'checkbox') reponses[cleDe(c)] = c.checked;
      else reponses[cleDe(c)] = c.value;
    });
    try {
      sessionStorage.setItem(CLE, JSON.stringify({
        reservation: reservation,
        reponses: reponses,
        ecran: courant ? courant.dataset.ecran : '',
        envoiId: envoiId
      }));
    } catch (e) { /* sans stockage, les réponses vivent le temps de la page */ }
  }
  function prevoirEnregistrement() {
    clearTimeout(enregistrementPrevu);
    enregistrementPrevu = setTimeout(enregistrer, 250);
  }

  // ——— Ce qui vient d'être réservé, sur le premier écran seulement ———
  var zoneReservation = form.querySelector('[data-reservation]');
  if (zoneReservation) {
    var debut = adresse.get('event_start_time');
    var date = debut ? new Date(debut) : null;
    if (date && !isNaN(date)) {
      var jour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(date);
      var heures = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'Europe/Paris' }).format(date).split(':');
      var heure = Number(heures[0]) + ' h' + (heures[1] !== '00' ? ' ' + heures[1] : '');
      zoneReservation.querySelector('[data-reservation-date]').textContent = jour.charAt(0).toUpperCase() + jour.slice(1) + ', à ' + heure;
    }
    // Le nom de la réservation est dit une fois : on sait pour qui l'on répond.
    zoneReservation.querySelector('[data-reservation-nom]').textContent = (reservation.prenom + ' ' + reservation.nom).trim();
    zoneReservation.hidden = !zoneReservation.textContent.trim();
  }

  // ——— Vérification, à l'endroit où l'erreur se corrige ———
  var formats = {
    email: function (v) { return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v); },
    telephone: function (v) { return /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 8; }
  };

  function deuxChiffres(n) { return (n < 10 ? '0' : '') + n; }

  // La date de naissance : trois champs, une vraie date du calendrier, et l'âge.
  function lireDate(bloc) {
    var p = {};
    tous('[data-date-partie]', bloc).forEach(function (c) { p[c.dataset.datePartie] = c.value.trim(); });
    if (!/^\d{1,2}$/.test(p.jour) || !/^\d{1,2}$/.test(p.mois) || !/^\d{4}$/.test(p.annee)) return null;
    var j = Number(p.jour), m = Number(p.mois), a = Number(p.annee);
    var d = new Date(a, m - 1, j);
    var aujourdhui = new Date();
    if (d.getFullYear() !== a || d.getMonth() !== m - 1 || d.getDate() !== j || d > aujourdhui || a < 1900) return null;
    var age = aujourdhui.getFullYear() - a;
    if (aujourdhui.getMonth() < m - 1 || (aujourdhui.getMonth() === m - 1 && aujourdhui.getDate() < j)) age -= 1;
    return { texte: deuxChiffres(j) + '/' + deuxChiffres(m) + '/' + a, age: age };
  }

  function reponduOuiA(noms) {
    return tous('input[type="radio"]:checked').some(function (r) {
      return !r.disabled && r.value === 'oui' && noms.indexOf(r.name) >= 0;
    });
  }

  // '' si le bloc est en règle ; sinon true, ou le message propre à ce cas.
  function erreurDe(bloc) {
    if ('date' in bloc.dataset) {
      var d = lireDate(bloc);
      bloc.querySelector('[data-date-valeur]').value = d ? d.texte : '';
      if (!d) return bloc.dataset.erreurFormat;
      if (d.age < Number(bloc.dataset.ageMinimum || 0)) return bloc.dataset.erreurAge;
      return '';
    }
    var champs = tous('input, select, textarea', bloc).filter(function (c) { return !c.disabled && c.type !== 'hidden'; });
    if (!champs.length) return '';
    if (champs[0].type === 'radio') return champs.some(function (c) { return c.checked; }) ? '' : true;
    if (champs[0].type === 'checkbox') return champs[0].checked ? '' : true;
    var valeur = champs[0].value.trim();
    if (!valeur) {
      if ('facultatif' in bloc.dataset) return '';
      if (bloc.dataset.requisSi) return reponduOuiA(bloc.dataset.requisSi.split(',')) ? true : '';
      return true;
    }
    var format = champs[0].dataset.format;
    return !format || formats[format](valeur) ? '' : true;
  }

  // L'erreur s'affiche avec les moyens du site (.is-danger sur le champ, une aide
  // .help.is-danger dessous) et se dit aux lecteurs d'écran : le champ, ou le groupe de
  // réponses, est marqué invalide et relié à son message.
  tous('.res-erreur').forEach(function (message, i) { message.id = 'res-erreur-' + (i + 1); });

  function marquer(bloc, erreur) {
    var enErreur = !!erreur;
    var message = bloc.querySelector('.res-erreur');
    if (message && typeof erreur === 'string') message.textContent = erreur;
    bloc.classList.toggle('est-en-erreur', enErreur);
    var cibles = bloc.getAttribute('role') === 'radiogroup' ? [bloc] : tous('input:not([type="hidden"]), select, textarea', bloc);
    tous('input:not([type="hidden"]), select, textarea', bloc).forEach(function (champ) {
      champ.classList.toggle('is-danger', enErreur);
    });
    cibles.forEach(function (cible) {
      if (!('decrit' in cible.dataset)) cible.dataset.decrit = cible.getAttribute('aria-describedby') || '';
      var decrit = cible.dataset.decrit + (enErreur && message ? ' ' + message.id : '');
      if (decrit.trim()) cible.setAttribute('aria-describedby', decrit.trim());
      else cible.removeAttribute('aria-describedby');
      if (enErreur) cible.setAttribute('aria-invalid', 'true');
      else cible.removeAttribute('aria-invalid');
    });
  }

  // Sans « montrer », la vérification ne touche pas à l'affichage : elle sert à savoir
  // si un écran déjà passé est toujours en règle.
  function verifier(ecran, montrerLesErreurs) {
    var premier = null;
    tous('[data-requis]', ecran).forEach(function (bloc) {
      if (bloc.closest('[hidden]') && bloc.closest('[hidden]') !== ecran) return;
      var erreur = erreurDe(bloc);
      if (montrerLesErreurs) marquer(bloc, erreur);
      if (erreur && !premier) premier = bloc;
    });
    if (premier && montrerLesErreurs) {
      premier.scrollIntoView({ block: 'center' });
      var champ = premier.querySelector('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])');
      if (champ) champ.focus({ preventScroll: true });
    }
    return !premier;
  }

  // L'erreur disparaît dès que la réponse est donnée.
  function effacer(e) {
    var bloc = e.target.closest('[data-requis]');
    if (!bloc || !bloc.classList.contains('est-en-erreur')) return;
    marquer(bloc, erreurDe(bloc));
  }

  // La date : des chiffres seulement, et le champ suivant quand celui-ci est plein.
  form.addEventListener('input', function (e) {
    var partie = e.target.dataset && e.target.dataset.datePartie;
    if (!partie) return;
    var chiffres = e.target.value.replace(/\D/g, '');
    if (chiffres !== e.target.value) e.target.value = chiffres;
    if (chiffres.length === e.target.maxLength && e.inputType && e.inputType.indexOf('insert') === 0) {
      var parties = tous('[data-date-partie]', e.target.closest('[data-date]'));
      var suivante = parties[parties.indexOf(e.target) + 1];
      if (suivante) suivante.focus();
    }
  });
  form.addEventListener('input', effacer);
  form.addEventListener('change', effacer);
  form.addEventListener('input', prevoirEnregistrement);
  form.addEventListener('change', prevoirEnregistrement);

  function ecranNomme(nom) {
    return ecrans.filter(function (e) { return e.dataset.ecran === nom; });
  }

  // ——— Les coordonnées que la réservation porte déjà ne sont pas redemandées ———
  // Après une réservation Calendly, le nom et l'e-mail ne sont jamais demandés : la
  // séance les porte, et Make rattache le questionnaire par l'identifiant. Seul le
  // téléphone peut manquer (la personne n'a pas voulu de rappel par SMS).
  // Sans identifiant — lien nu, inscription à une journée — tout est demandé.
  var identite = ecranNomme('identite')[0];
  if (identite && (contexte === 'seance' || contexte === 'decouverte')) {
    var aDemander = 0;
    ['prenom', 'nom', 'email', 'telephone'].forEach(function (cle) {
      var bloc = identite.querySelector('[data-identite="' + cle + '"]');
      var champ = bloc.querySelector('input');
      var connu = !!reservation[cle] && !erreurDe(bloc);
      if (connu || (reservation.uuid && cle !== 'telephone')) {
        bloc.hidden = true;
        // Un champ resté vide n'est pas envoyé : Make lit l'identité sur la séance.
        if (!connu) champ.disabled = true;
      } else {
        aDemander += 1;
      }
    });
    if (!aDemander) identite.dataset.inactif = '';
  }

  // ——— La journée déjà choisie sur la page d'un évènement ———
  // Le bouton « S'inscrire » d'une page d'évènement porte ?notion_page_id=<id>
  // (_plugins/page_drop.rb). Reçue ainsi, la date est retenue : l'écran du choix cède
  // la place à un accueil qui la rappelle. Sans identifiant, ou si la date n'est plus
  // proposée, le choix reste à faire.
  var journee = ecranNomme('journee')[0];
  var accueilJournee = form.querySelector('[data-si-journee-retenue]');
  if (journee) {
    var retenue = null;
    tous('input[name="notion_page_id"]', journee).forEach(function (radio) {
      if (reservation.journee && radio.value === reservation.journee) retenue = radio;
    });
    if (retenue) {
      journee.dataset.inactif = '';
      accueilJournee.querySelector('[data-journee-libelle]').textContent = retenue.dataset.libelle;
    } else if (accueilJournee) {
      accueilJournee.dataset.inactif = '';
    }
  }

  // ——— La version, et la suite d'écrans qui en découle ———
  function version() {
    if (form.dataset.versionFixe) return form.dataset.versionFixe;
    var choix = form.querySelector('input[name="version"]:checked');
    return choix ? choix.value : '';
  }

  function reprise() {
    var choix = form.querySelector('input[name="coordonnees_reprises"]:checked');
    return choix ? choix.value : '';
  }

  var blocNaissance = form.querySelector('[data-date]');
  function estMineur() {
    if (!blocNaissance || blocNaissance.querySelector('[data-date-partie]').disabled) return false;
    var d = lireDate(blocNaissance);
    return !!d && d.age < 18 && d.age >= Number(blocNaissance.dataset.ageMinimum || 0);
  }

  // « hypothese » remplace une réponse pas encore donnée, pour estimer la longueur du
  // parcours (voir mesurer).
  function estActif(ecran, hypothese) {
    var v = (hypothese && hypothese.version) || version();
    var miseAJour = hypothese && 'miseAJour' in hypothese ? hypothese.miseAJour : reprise() === 'mettre-a-jour';
    if ('inactif' in ecran.dataset) return false;
    if (ecran.dataset.version && ecran.dataset.version !== v) return false;
    if ('siCoordonnees' in ecran.dataset) return v === 'complet' || (v === 'suivi' && miseAJour);
    if ('siMineur' in ecran.dataset) return !hypothese && estMineur();
    return true;
  }

  function actifs() {
    return ecrans.filter(function (e) { return estActif(e); });
  }

  // Une question d'une autre version, ou un écran hors de la suite, n'est ni vérifié
  // ni envoyé.
  function appliquerVersion() {
    var v = version();
    tous('[data-version]').forEach(function (el) {
      var visible = el.dataset.version === v;
      if (!el.hasAttribute('data-ecran')) el.hidden = !visible;
      tous('input, select, textarea', el).forEach(function (champ) { champ.disabled = !visible; });
    });
    tous('[data-si-coordonnees]').forEach(function (el) {
      var actif = estActif(el);
      tous('input, select, textarea', el).forEach(function (champ) { champ.disabled = !actif; });
    });
    mesurer();
  }
  tous('input[name="version"], input[name="coordonnees_reprises"]').forEach(function (radio) {
    radio.addEventListener('change', appliquerVersion);
  });

  // ——— L'avancement : le segment de l'étape en cours, dans la barre du parcours ———
  // Tant qu'une réponse qui change la suite n'est pas donnée, on compte le parcours le
  // plus long : la barre peut sauter en avant, elle ne recule pas.
  function longueurPrevue() {
    var hypotheses = [];
    if (!version()) hypotheses = [{ version: 'complet' }, { version: 'suivi', miseAJour: true }];
    else if (version() === 'suivi' && !reprise()) hypotheses = [{ version: 'suivi', miseAJour: true }];
    var longueur = actifs().length;
    hypotheses.forEach(function (h) {
      longueur = Math.max(longueur, ecrans.filter(function (e) { return estActif(e, h); }).length);
    });
    return longueur;
  }

  function mesurer() {
    if (!courant) return;
    var position = actifs().indexOf(courant);
    var longueur = longueurPrevue();
    if (avancement) avancement.style.width = Math.round(((position + 1) / (longueur + 1)) * 100) + '%';
    if (annonce) annonce.textContent = 'Écran ' + (position + 1) + ' sur ' + longueur;
  }

  // ——— Passer d'un écran à l'autre : il glisse dans le sens de la marche ———
  function montrer(cible, sens, sansEffet) {
    if (!cible || cible === courant) return;
    // Un changement en cours est mené à son terme avant d'en commencer un autre.
    clearTimeout(minuterie);
    var sortant = courant;
    courant = cible;
    enTransition = true;

    function entrer() {
      ecrans.forEach(function (e) {
        if (e === cible) return;
        e.hidden = true;
        e.classList.remove('est-hors-champ');
      });
      cible.style.setProperty('--res-decalage', (sens >= 0 ? 12 : -12) + 'px');
      if (!sansEffet) cible.classList.add('est-hors-champ');
      // Pas de « Retour » sur le premier écran de la suite, quel qu'il soit.
      var retour = cible.querySelector('[data-precedent]');
      if (retour) retour.hidden = actifs()[0] === cible;
      cible.hidden = false;
      window.scrollTo(0, 0);
      mesurer();
      enregistrer();
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
      minuterie = setTimeout(entrer, DUREE);
    } else {
      entrer();
    }
  }

  // ——— L'historique ———
  // Chaque écran entre dans l'historique : le bouton et le geste « retour » du
  // navigateur reviennent à l'écran précédent sans quitter la page. Une entrée ne dit
  // que son rang : « suivant » dans le navigateur vaut « Continuer » (l'écran quitté est
  // vérifié), « précédent » vaut « Retour ». La suite d'écrans peut changer en route
  // (version, mise à jour) : on ne se fie donc jamais au nom d'écran d'une vieille entrée.
  var rang = 0;

  // « etat » : ce que l'entrée portait déjà et qu'il faut lui laisser (la vue ouverte à
  // l'intérieur d'un écran — le jour choisi, sur téléphone).
  function noter(etat) {
    history.replaceState(Object.assign({}, etat, { ecran: courant.dataset.ecran, rang: rang }), '');
  }

  function avancer(parLHistorique) {
    if (enTransition || enEnvoi || !verifier(courant, true)) return;
    var suite = actifs();
    var suivant = suite[suite.indexOf(courant) + 1];
    if (!suivant) {
      // Le dernier écran : on envoie — jamais par le bouton « suivant » du navigateur.
      if (!parLHistorique) envoyer();
      return;
    }
    if (!parLHistorique) {
      rang += 1;
      history.pushState({ ecran: suivant.dataset.ecran, rang: rang }, '');
    }
    montrer(suivant, 1);
  }

  function reculer() {
    var suite = actifs();
    var precedent = suite[suite.indexOf(courant) - 1];
    if (precedent) montrer(precedent, -1);
  }

  window.addEventListener('popstate', function (e) {
    if (!e.state || typeof e.state.rang !== 'number' || enEnvoi) return;
    // Une entrée de même rang est une vue à l'intérieur de l'écran : il ne change pas,
    // et la page qui a posé cette entrée s'en occupe.
    if (e.state.rang === rang) return;
    var versLAvant = e.state.rang > rang;
    rang = e.state.rang;
    if (versLAvant) avancer(true);
    else reculer();
    noter(e.state);
  });

  // La page qui porte le formulaire peut ramener à un écran nommé (res:aller) : ce qui
  // y avait été choisi n'est plus valable. Les réponses restent en place.
  form.addEventListener('res:aller', function (e) {
    var cible = ecranNomme(e.detail.ecran).filter(function (x) { return estActif(x); })[0];
    if (!cible || cible === courant || enEnvoi) return;
    montrer(cible, -1, true);
    noter();
  });

  // ——— L'envoi ———
  // Tous les écrans de la suite sont revérifiés : un retour en arrière a pu vider une
  // réponse, ou changer de version. Make refait le même contrôle de son côté.
  function premierEcranEnDefaut() {
    return actifs().filter(function (e) { return !verifier(e, false); })[0] || null;
  }

  function envoyer() {
    if (enEnvoi) return;
    var enDefaut = premierEcranEnDefaut();
    if (enDefaut) {
      montrer(enDefaut, -1, true);
      noter();
      verifier(enDefaut, true);
      return;
    }
    var bouton = courant.querySelector('[type="submit"]');
    var lent = courant.querySelector('[data-envoi-lent]');
    var echec = courant.querySelector('[data-envoi-erreur]');
    enEnvoi = true;
    bouton.disabled = true;
    bouton.classList.add('is-loading');
    if (echec) echec.hidden = true;

    // Avec l'origine de l'API (data-api, posée par la configuration de recette), le
    // questionnaire part vers la porte publique de gestion ; sans elle — et toujours
    // pour la prise de rendez-vous, que gestion ne reçoit pas encore —, l'envoi reste
    // simulé : ?simuler=lent, ?simuler=echec et ?simuler=pris montrent les états à
    // prévoir. Mêmes seuils dans les deux cas : message d'attente après 8 s, échec
    // déclaré après 30 s.
    var mode = adresse.get('simuler');
    var reel = !!form.dataset.api;
    var rendezVous = form.hasAttribute('data-rendez-vous');
    var attente = setTimeout(function () { if (lent) lent.hidden = false; }, mode === 'lent' ? 1500 : 8000);

    function issue(resultat) {
      clearTimeout(attente);
      if (lent) lent.hidden = true;
      if (resultat === 'echec') {
        enEnvoi = false;
        bouton.disabled = false;
        bouton.classList.remove('is-loading');
        bouton.textContent = 'Réessayer';
        if (echec) { echec.hidden = false; echec.focus(); }
        return;
      }
      // Un refus (le créneau vient d'être pris) n'est pas une panne : la page qui porte
      // le formulaire dit pourquoi (res:refus) et retire ce qui n'est plus valable ; on
      // revient alors au premier écran qui n'est plus en règle, réponses conservées.
      if (resultat === 'pris') {
        enEnvoi = false;
        bouton.disabled = false;
        bouton.classList.remove('is-loading');
        form.dispatchEvent(new CustomEvent('res:refus', { detail: { motif: 'creneau_pris' } }));
        var aReprendre = premierEcranEnDefaut();
        if (aReprendre) {
          montrer(aReprendre, -1, true);
          noter();
          verifier(aReprendre, true);
        }
        return;
      }
      // La page peut compléter l'adresse de la suite (res:envoye) avant qu'on n'y parte.
      var depart = { suite: form.dataset.suite };
      form.dispatchEvent(new CustomEvent('res:envoye', { detail: depart }));
      envoye = true;
      clearTimeout(enregistrementPrevu);
      oublier();
      location.href = depart.suite;
    }

    if (!reel) {
      setTimeout(function () { issue(mode === 'echec' ? 'echec' : mode === 'pris' ? 'pris' : 'ok'); },
        mode === 'lent' ? 5000 : mode === 'echec' ? 1200 : 400);
      return;
    }

    // Le vrai envoi. Le même envoiId sert de clé : une relance après un échec rend le
    // même reçu, sans second questionnaire (règle 5 de gestion). Un refus « invalide »
    // est une panne pour la personne : la page a déjà tout vérifié, c'est un écart de
    // contrat à corriger, pas une saisie à reprendre.
    var abandon = new AbortController();
    var delai = setTimeout(function () { abandon.abort(); }, 30000);
    fetch(form.dataset.api.replace(/\/$/, '') + (rendezVous ? '/v1/reservation' : '/v1/questionnaires'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rendezVous ? laReservation() : versLeContrat()),
      signal: abandon.signal,
      credentials: 'omit',
    }).then(function (r) {
      return r.status === 200 ? r.json() : null;
    }).then(function (reponse) {
      clearTimeout(delai);
      if (reponse && reponse.ok === true && rendezVous) form.dataset.reference = reponse.reference;
      // Le créneau n'est plus disponible (pris entre-temps, ou sorti de la fenêtre) : un refus,
      // pas une panne — la page le dit et fait choisir une autre heure.
      if (reponse && reponse.ok === false && (reponse.motif === 'creneau_pris' || reponse.motif === 'hors_fenetre')) {
        envoiId = nouvelIdentifiant();
        return issue('pris');
      }
      issue(reponse && reponse.ok === true ? 'ok' : 'echec');
    }).catch(function () {
      clearTimeout(delai);
      issue('echec');
    });
  }

  // ——— Le contrat de gestion (packages/contrat, questionnaire) ———
  // Les noms des champs restent ceux des scénarios Make ; ce qui part vers gestion est
  // composé ici, à l'envoi. Une valeur vide part comme null, jamais comme "".
  var VERSION_FORMULAIRE = 'site-2026-11';
  var CONTEXTES = { seance: 'seance', decouverte: 'decouverte', groupe: 'groupe', journee: 'journee_externe' };

  function valeur(nom) {
    var champ = form.elements[nom];
    if (!champ) return null;
    var v = champ.value !== undefined ? champ.value : '';
    v = String(v || '').trim();
    return v === '' ? null : v;
  }
  function civilite(v) { return v === 'Mme' || v === 'M.' ? v : null; }

  // La réservation (contrat §3.1) : le type, le début choisi, l'identité, et ce que le type
  // demande en plus. Les questions partent avec leur libellé, dans l'ordre de la page.
  function laReservation() {
    var reponses = [];
    tous('[name^="reponses["]').forEach(function (champ) {
      if (champ.type === 'radio' && !champ.checked) return;
      if (champ.closest('[data-ecran]') && !estActif(champ.closest('[data-ecran]'))) return;
      var texte = String(champ.value || '').trim();
      if (!texte || reponses.some(function (r) { return r.nom === champ.name; })) return;
      var groupe = champ.closest('[role="radiogroup"]');
      var etiquette = groupe ? document.getElementById(groupe.getAttribute('aria-labelledby')) : form.querySelector('label[for="' + champ.id + '"]');
      reponses.push({ nom: champ.name, question: ((etiquette && etiquette.textContent) || champ.name).trim().replace(/\s+/g, ' ').slice(0, 500), reponse: texte.slice(0, 2000) });
    });
    var choisi = form.querySelector('input[name="debut"]:checked');
    var mode = form.querySelector('input[name="mode"]:checked');
    var envoi = {
      cle: envoiId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64),
      type: form.dataset.type,
      debut: choisi ? choisi.value : '',
      identite: {
        prenom: valeur('identite[prenom]') || '',
        nom: valeur('identite[nom]') || '',
        email: valeur('identite[email]') || '',
        telephone: valeur('identite[telephone]'),
      },
      reponses: reponses.map(function (r, i) { return { rang: i + 1, question: r.question, reponse: r.reponse }; }),
    };
    if (mode) envoi.mode = mode.value;
    if (form.elements.conditions && form.elements.conditions.checked) envoi.conditions = { acceptees: true, version: 1 };
    if (form.elements.liste_attente) envoi.liste_attente = !!form.elements.liste_attente.checked;
    return envoi;
  }

  function versLeContrat() {
    var version = valeur('version');
    var reponses = [];
    var vues = {};
    tous('input[name^="sante["], input[name^="sante_suite["], textarea[name^="sante"]').forEach(function (champ) {
      var nom = champ.name;
      if (vues[nom]) return;
      if (champ.closest('[data-ecran]') && !estActif(champ.closest('[data-ecran]'))) return;
      var ligne = champ.closest('.res-ligne, .field');
      var question = ligne && ligne.querySelector('.res-ligne-question, label');
      var choisi = champ.type === 'radio' ? form.querySelector('input[name="' + nom + '"]:checked') : champ;
      var texte = choisi ? String(choisi.value || '').trim() : '';
      vues[nom] = true;
      if (!texte) return;
      reponses.push({
        cle: nom.replace(/\]$/, '').replace('[', '.').toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 80),
        libelle: ((question && question.textContent) || nom).trim().replace(/\s+/g, ' ').slice(0, 500),
        reponse: texte.slice(0, 2000),
      });
    });

    var envoi = {
      cle: envoiId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64),
      contexte: CONTEXTES[contexte] || 'seance',
      version: version === 'suivi' ? 'suivi' : 'complet',
      version_formulaire: VERSION_FORMULAIRE,
      identite: {
        prenom: valeur('coordonnees_participant[prenom]') || '',
        nom: valeur('coordonnees_participant[nom]') || '',
        email: valeur('coordonnees_participant[email]') || '',
        telephone: valeur('coordonnees_participant[telephone]'),
      },
      reponses: reponses,
      declaration: true,
      accord: { accepte: true, version: 1 },
    };
    if (version !== 'suivi' || valeur('coordonnees_reprises') === 'oui') {
      envoi.coordonnees = {
        civilite: civilite(valeur('coordonnees_participant[genre]')),
        date_naissance: valeur('coordonnees_participant[date-naissance]'),
        profession: valeur('coordonnees_participant[profession]'),
        adresse: valeur('coordonnees_participant[adresse]'),
        code_postal: valeur('coordonnees_participant[code_postal]'),
        ville: valeur('coordonnees_participant[ville]'),
      };
      envoi.confiance = {
        civilite: civilite(valeur('coordonnees_secours[genre]')),
        prenom: valeur('coordonnees_secours[prenom]'),
        nom: valeur('coordonnees_secours[nom]'),
        telephone: valeur('coordonnees_secours[telephone]'),
        email: valeur('coordonnees_secours[email]'),
      };
    }
    var informations = valeur('informations-complementaires');
    if (informations) envoi.informations = informations;
    // Le lien d'un questionnaire porte sa référence après le # (gestion, §14.5).
    if (reference) envoi.reference = reference;
    else if (contexte === 'journee' && valeur('notion_page_id')) envoi.evenement = valeur('notion_page_id').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
    return envoi;
  }

  // Revenir sur le questionnaire après l'envoi ne doit pas rendre les réponses lisibles
  // (le navigateur peut ressortir la page telle qu'il l'a quittée).
  var aRepondu = false;
  function noterUneReponse(e) { if (e.isTrusted) aRepondu = true; }
  form.addEventListener('input', noterUneReponse);
  form.addEventListener('change', noterUneReponse);

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      if (!envoye) return;
      form.reset();
      oublier();
      location.reload();
      return;
    }
    // Page rouverte par l'historique : le navigateur remet de lui-même les anciennes
    // valeurs dans les champs, après les scripts. Sans brouillon — donc après un envoi,
    // ou pour une autre réservation — elles n'ont rien à faire là.
    if (!brouillon && !aRepondu) {
      form.reset();
      poserLaReservation();
      appliquerVersion();
    }
  });
  window.addEventListener('pagehide', function () {
    clearTimeout(enregistrementPrevu);
    enregistrer();
  });

  form.addEventListener('click', function (e) {
    // Un bouton qui déplie un texte (le texte complet de l'avertissement) et le replie.
    var deplier = e.target.closest('[data-deplier]');
    if (deplier) {
      var texte = document.getElementById(deplier.dataset.deplier);
      var ouvert = texte.hidden;
      texte.hidden = !ouvert;
      deplier.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      if (!deplier.dataset.libelleFerme) deplier.dataset.libelleFerme = deplier.textContent;
      deplier.textContent = ouvert ? deplier.dataset.libelleOuvert : deplier.dataset.libelleFerme;
      return;
    }
    if (e.target.closest('[data-suivant]')) avancer();
    if (e.target.closest('[data-precedent]') && !enTransition) {
      // Sans entrée d'historique derrière soi (brouillon repris au milieu du parcours),
      // « Retour » reste dans le questionnaire au lieu de quitter la page.
      if (rang > 0) history.back();
      else reculer();
    }
  });

  // Entrée dans un champ, ou le bouton d'envoi du dernier écran.
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    avancer();
  });

  // ——— Départ ———
  ecrans.forEach(function (ecran) { ecran.hidden = true; });
  appliquerVersion();
  var suiteDeDepart = actifs();
  if (!suiteDeDepart.length) return;
  var depart = suiteDeDepart[0];
  if (brouillon && brouillon.ecran) {
    // Page rechargée : on reprend à l'écran quitté, sans dépasser le premier écran qui
    // ne serait plus en règle.
    var voulu = ecranNomme(brouillon.ecran).filter(function (e) { return estActif(e); })[0];
    for (var i = 0; voulu && i < suiteDeDepart.length; i += 1) {
      depart = suiteDeDepart[i];
      if (depart === voulu || !verifier(depart, false)) break;
    }
  }
  if (history.state && typeof history.state.rang === 'number') rang = history.state.rang;
  montrer(depart, 1, true);
  noter(history.state);
})();
