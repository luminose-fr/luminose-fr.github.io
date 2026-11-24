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
    rendreLeResteInerte(ouvert);
    if (ouvert) menu.scrollTop = 0;
  }

  // Menu ouvert, la page qu'il recouvre ne doit plus recevoir ni le clavier ni le
  // lecteur d'écran : tout ce qui n'est pas l'en-tête devient inerte, puis le redevient.
  function rendreLeResteInerte(ouvert) {
    for (var noeud = entete; noeud && noeud !== document.body; noeud = noeud.parentNode) {
      Array.prototype.forEach.call(noeud.parentNode.children, function (voisin) {
        if (voisin === noeud || voisin.tagName === 'SCRIPT') return;
        if (ouvert && !voisin.inert) {
          voisin.inert = true;
          voisin.dataset.enteteInerte = '';
        } else if (!ouvert && 'enteteInerte' in voisin.dataset) {
          voisin.inert = false;
          delete voisin.dataset.enteteInerte;
        }
      });
    }
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

  // Le sous-menu défile sur le côté. La page en cours est amenée à l'écran sans être
  // centrée : le lien qui la précède reste coupé à mi-mot, ce qui dit mieux qu'un fondu
  // qu'il y a d'autres pages de ce côté. Le fondu ne se pose que là où il reste à défiler.
  var sousMenu = document.querySelector('[data-entete-sous-menu]');
  if (!sousMenu) return;

  function fondus() {
    var reste = sousMenu.scrollWidth - sousMenu.clientWidth - sousMenu.scrollLeft;
    sousMenu.classList.toggle('a-defiler-a-gauche', sousMenu.scrollLeft > 2);
    sousMenu.classList.toggle('a-defiler-a-droite', reste > 2);
  }

  var enCours = sousMenu.querySelector('[aria-current]');
  var precedent = enCours && enCours.previousElementSibling;
  if (precedent) {
    var coupe = precedent.offsetLeft + precedent.offsetWidth / 2;
    // La page en cours doit tenir entière à l'écran, même si son libellé est long.
    var entiere = enCours.offsetLeft + enCours.offsetWidth + 16 - sousMenu.clientWidth;
    var voulu = Math.max(coupe, entiere, 0);
    // En fin de liste, la ligne ne défile pas assez loin pour couper le lien précédent :
    // un blanc après le dernier lien lui en donne la course.
    var manque = voulu - (sousMenu.scrollWidth - sousMenu.clientWidth);
    if (manque > 0) {
      var dernier = sousMenu.lastElementChild;
      dernier.style.marginRight = (parseFloat(getComputedStyle(dernier).marginRight) + manque) + 'px';
    }
    sousMenu.scrollLeft = voulu;
  }
  sousMenu.addEventListener('scroll', fondus, { passive: true });
  window.addEventListener('resize', fondus);
  fondus();
})();
