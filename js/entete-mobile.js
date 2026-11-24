// Proposition d'en-tête pour téléphone (_includes/maquettes/entete-mobile.html).
(function () {
  'use strict';

  var entete = document.querySelector('[data-entete-mobile]');
  if (!entete) return;

  var bouton = entete.querySelector('[data-entete-menu]');
  var menu = document.getElementById('entete-menu');

  function ouvrir(ouvert) {
    menu.classList.toggle('est-ouvert', ouvert);
    bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    // Le même bouton ouvre et ferme : son libellé dit ce qu'il fera.
    bouton.textContent = ouvert ? 'Fermer' : 'Menu';
    // La page ne défile pas sous le menu.
    document.documentElement.classList.toggle('entete-menu-ouvert', ouvert);
    if (ouvert) menu.scrollTop = 0;
  }

  bouton.addEventListener('click', function () {
    ouvrir(bouton.getAttribute('aria-expanded') !== 'true');
  });

  // Un lien du menu, ou « Rendez-vous » dans la barre, referme le menu avant d'agir.
  entete.addEventListener('click', function (e) {
    if (e.target.closest('a')) ouvrir(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') {
      ouvrir(false);
      bouton.focus();
    }
  });

  // Le sous-menu défile sur le côté : la page en cours y est amenée au centre.
  var sousMenu = document.querySelector('[data-entete-sous-menu]');
  var enCours = sousMenu && sousMenu.querySelector('[aria-current]');
  if (enCours) sousMenu.scrollLeft = enCours.offsetLeft - (sousMenu.clientWidth - enCours.offsetWidth) / 2;
})();
