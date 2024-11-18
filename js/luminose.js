(() => {
  let oldPushState = history.pushState;
  history.pushState = function pushState() {
    let ret = oldPushState.apply(this, arguments);
    window.dispatchEvent(new Event('pushstate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  };

  let oldReplaceState = history.replaceState;
  history.replaceState = function replaceState() {
    let ret = oldReplaceState.apply(this, arguments);
    window.dispatchEvent(new Event('replacestate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  };

  window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'));
  });
})();

class BulmaModal {
  constructor(selector) {
    this.elem = document.querySelector(selector)
    this.close_data()
  }

  show() {
    this.elem.classList.toggle('is-active')
    this.on_show()
  }

  close() {
    this.elem.classList.toggle('is-active')
    this.on_close()
  }

  close_data() {
    var modalClose = this.elem.querySelectorAll("[data-bulma-modal='close'], .modal-background:not(.is-disabled)")
    var that = this
    modalClose.forEach(function(e) {
      e.addEventListener("click", function() {
        that.elem.classList.toggle('is-active')
        var event = new Event('modal:close')
        that.elem.dispatchEvent(event);
      })
    })
  }

  on_show() {
    var event = new Event('modal:show')
    this.elem.dispatchEvent(event);
  }

  on_close() {
    var event = new Event('modal:close')
    this.elem.dispatchEvent(event);
  }

  addEventListener(event, callback) {
    this.elem.addEventListener(event, callback)
  }
}

// Main App
var App = {

  _config: {

  },

  run: function() {
    this.setupViewport();
    this.setupCookiesModal();
    this.setupNavigation();
    this.setupButtonPriseRdv();
    this.setupSocialLinks();
    this.setupButtonConfirmationQuestionnaireSante();
    this.setupUTMParamsPropagation();
    this.setupFormPrefill();
    this.setupFormValidation();
    this.respiration.run();
  },

  setupViewport: function() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.addEventListener('resize', function() {
      var vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
  },

  setupCookiesModal: function() {
    var that = this;
    that.cookiesConsentValue = that._getCookie('cookiesConsent'); // Not set OR denied OR granted

    _modal = document.querySelector('#md-cookies');
    if (_modal !== null) {
      var modal = new BulmaModal("#md-cookies");
      var btCookiesReject = _modal.querySelector('#bt-cookies-reject');
      var btCookiesAccept = _modal.querySelector('#bt-cookies-accept');
      var btUpdateCookies = document.querySelector('#bt-cookies-update');

      if (btUpdateCookies !== null) {
        btUpdateCookies.addEventListener("click", function(event) {
          event.preventDefault();
          that._setCookie('cookiesConsent', '', "Thu, 01 Jan 1970 00:00:00 UTC");
          that.cookiesConsentValue = that._getCookie('cookiesConsent');
          modal.show();
        });
      }

      btCookiesAccept.addEventListener("click", function(event) {
        event.preventDefault();
        that._setCookie('cookiesConsent', 'granted', 365);
        that.cookiesConsentValue = that._getCookie('cookiesConsent');
        gtag('consent', 'update', {
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted',
          'analytics_storage': 'granted',
          'personalization_storage': 'granted',
          'functionality_storage': 'granted',
          'security_storage': 'granted'
        });
        modal.close();
      });

      btCookiesReject.addEventListener("click", function(event) {
        event.preventDefault();
        that._setCookie('cookiesConsent', 'denied', 365);
        that.cookiesConsentValue = that._getCookie('cookiesConsent');
        gtag('consent', 'update', {
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied',
          'analytics_storage': 'denied',
          'personalization_storage': 'denied',
          'functionality_storage': 'denied',
          'security_storage': 'denied'
        });
        modal.close();
      });

      if (that.cookiesConsentValue != 'granted' && that.cookiesConsentValue != 'denied') {
        modal.show();
      } else {
        if (that.cookiesConsentValue == 'granted') {
          gtag('consent', 'update', {
            'ad_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted',
            'analytics_storage': 'granted',
            'personalization_storage': 'granted',
            'functionality_storage': 'granted',
            'security_storage': 'granted'
          });
        }
      }
    }

  },

  setupNavigation: function() {
    this.navbars = {
      main: null,
      secondary: null,
      relative: null,
      mobileNavbarBrand: null
    };
    this.navbarsHeights = {
      main: null,
      mainNavigation: null,
      mobileMenu: null,
      secondary: null
    };
    if (this.navbars.main == null) {
      this.navbars.main = document.getElementById("main-navbar");
      this.navbars.relative = document.getElementById('relative-navbar');
      this.navbars.secondary = document.getElementById('secondary-navbar');
      this.navbars.mobileNavbarBrand = document.getElementById("mobile-navbar-brand");

      this.burgerButton = document.getElementById('bt-navigation');
    }
    if (this.navbars.main !== null) {
      this._loadNavbarsHeights();
      this._stickNavigation();
      this._enableButtonBurger();
    }
    if (this.hypnotherapyTabs == null) {
      this.hypnotherapyTabs = document.getElementById("hypnotherapy-tabs");
    }
    if (this.hypnotherapyTabs !== null && this.hypnotherapyTabs !== undefined) {
      var that = this;
      that.hypnotherapyTabs.items = that.hypnotherapyTabs.querySelectorAll('.tabs ul li a');
      that.hypnotherapyTabs.tabs = that.hypnotherapyTabs.querySelectorAll('.tab-content');
      that.hypnotherapyTabs.tabsContainer = that.hypnotherapyTabs.querySelector('.tabs');
      that.hypnotherapyTabs.contentContainer = that.hypnotherapyTabs.querySelector('.content-wrap');

      // Track clicks on the menu
      that.hypnotherapyTabs.items.forEach(function(item) {
        item.addEventListener("click", function(event) {
          event.preventDefault();
          history.pushState({}, '', item.getAttribute("data-target"));
        });
      });

      // Load the good tab depending on anchor and scroll accorgingly
      var realblockHeight = this.navbarsHeights.secondary; //this.navbarsHeights.main +
      var elementPosition = that.hypnotherapyTabs.getBoundingClientRect().top;
      var offsetPosition = elementPosition + window.pageYOffset - realblockHeight;
      //console.log(offsetPosition);

      if (window.location.hash !== '' && window.location.hash !== '#prise-rdv') {
        that._selectNavigationItem(window.location.hash)
        setTimeout(function() {
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }, 30);
      }

      // Setup mobile button for Tabs menu
      var mobileTabsButton = that.hypnotherapyTabs.querySelector('#mobile-tabs-toggle');
      if (mobileTabsButton !== null) {
        mobileTabsButton.addEventListener("click", function() {
          that.hypnotherapyTabs.contentContainer.classList.add('is-hidden-mobile');
          that.hypnotherapyTabs.tabsContainer.classList.remove('is-hidden-mobile');
          // console.log(window.location);
          history.pushState({}, '', window.location.origin + window.location.pathname);
        });
      }

      // Track URL change : clics on # & <previous & next from browser
      window.addEventListener('locationchange', function(event) {
        that._selectNavigationItem(window.location.hash)
      });
    }

    if (this.ficheMethodologiqueTabs == null) {
      this.ficheMethodologiqueTabs = document.querySelectorAll(".fiche-methodologique");
    }
    if (this.ficheMethodologiqueTabs !== null && this.ficheMethodologiqueTabs !== undefined) {
      var that = this;

      that.ficheMethodologiqueTabs.forEach(function(tabsContainer) {
        tabsContainer.items = tabsContainer.querySelectorAll('.tabs ul li a');
        tabsContainer.tabs = tabsContainer.querySelectorAll('.tab-content');
        tabsContainer.items.forEach(function(item) {
          item.addEventListener("click", function(event) {
            var hash = item.getAttribute("href");
            event.preventDefault();
            selectedItem = tabsContainer.querySelector('a[href="' + hash + '"]');
            selectedTab = tabsContainer.querySelector(hash);
            tabsContainer.items.forEach(function(i) {
              i.classList.remove('is-active');
            });
            tabsContainer.tabs.forEach(function(t) {
              t.classList.remove('is-active');
            });
            selectedItem.classList.add('is-active');
            selectedTab.classList.add('is-active');
          });
        });
      });
    }
  },

  setupButtonPriseRdv: function() {
    if (document.querySelector('#md-prise-rdv') !== null) {
      var modal = new BulmaModal("#md-prise-rdv");
      var that = this;
      var btSeanceAdulte = document.querySelector('#bt-seance-adulte');
      var btSeanceEnfant = document.querySelector('#bt-seance-enfant');
      var btSeanceRespiration = document.querySelector('#bt-seance-respiration');

      var buttons = document.querySelectorAll('.bt-prise-rdv');
      buttons.forEach(function(button) {
        button.addEventListener("click", function(event) {
          event.preventDefault();
          modal.show();
        });
      });

      if (btSeanceAdulte !== null) {
        btSeanceAdulte.addEventListener("click", function(event) {
          event.preventDefault();
          modal.close();
          Calendly.initPopupWidget({
            url: 'https://calendly.com/luminose/seance-hypnose?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
            utm: that._getUtmParams()
          });
        });
      }
      
      if (btSeanceEnfant !== null) {
        btSeanceEnfant.addEventListener("click", function(event) {
          event.preventDefault();
          modal.close();
          Calendly.initPopupWidget({
            url: 'https://calendly.com/luminose/seance-hypnose-enfant?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
            utm: that._getUtmParams()
          });
        });
      }

      if (btSeanceRespiration !== null) {
        btSeanceRespiration.addEventListener("click", function(event) {
          event.preventDefault();
          modal.close();
          Calendly.initPopupWidget({
            url: 'https://calendly.com/luminose/seance-respiration-holotropique?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
            utm: that._getUtmParams()
          });
        });
      }

      

      if (window.location.hash === '#prise-rdv') {
        event.preventDefault;
        modal.show();
        var uri = window.location.toString();
        if (uri.indexOf("#") > 0) {
          var clean_uri = uri.substring(0, uri.indexOf("#"));
          window.history.replaceState({}, document.title, clean_uri);
        }
      }
    }
  },

  setupButtonConfirmationQuestionnaireSante: function() {
    if (document.querySelector('.is-questionnaire-sante') !== null) {
      var that = this;

      var prenom = decodeURIComponent(that.getParamFromCurrentPage('invitee_first_name').replaceAll('+', ' '));
      var nom = decodeURIComponent(that.getParamFromCurrentPage('invitee_last_name').replaceAll('+', ' '));
      var email = decodeURIComponent(that.getParamFromCurrentPage('invitee_email').replaceAll('+', ' '));
      var telephone = decodeURIComponent(that.getParamFromCurrentPage('text_reminder_number').replaceAll('+', ' '));
      var params = new URLSearchParams();

      if (prenom !== null && prenom !== '') {
        params.append('coordonnees_participant[prenom]', prenom);
      }
      if (nom !== null && nom !== '') {
        params.append('coordonnees_participant[nom]', nom);
      }
      if (email !== null && email !== '') {
        params.append('coordonnees_participant[email]', email);
      }
      if (telephone !== null && telephone !== '') {
        params.append('coordonnees_participant[telephone]', telephone);
      }
      
      var buttons = document.querySelectorAll('.is-questionnaire-sante');
      buttons.forEach(function(button) {
        const url = new URL(button.href);
        url.search = params;
        button.href = url.href;
      });
    }
  },

  getParamFromCurrentPage: function(param_name) {
    param_name = param_name.replace(/([\[\]])/g, "\\\$1");
    var regex = new RegExp("[\\?&]" + param_name + "=([^&#]*)"),
      results = regex.exec(window.location.href);
    return results ? results[1] : "";
  },

  setupSocialLinks: function() {
    var links = document.querySelectorAll('a.social-link');
    var firstLinkText = document.querySelector(".liens-partager .is-hidden-touch");

    links.forEach(function(link) {
      link.addEventListener("click", function(event) {
        if (window.getComputedStyle(firstLinkText, null).display == 'block' ? true : false) {
          var url = link.getAttribute("href");
          var params = 'scrollbars=no,status=no,location=no,toolbar=no,menubar=no,width=700,height=700';
          window.open(url, '', params);
          event.preventDefault();
        }
      });
    });
  },

  setupUTMParamsPropagation: function() {
    // use URLSerachParams to get strings <- does not work in Internet Explorer
    let deleteParams = [];
    const utmParamQueryString = new URLSearchParams(window.location.search);

    utmParamQueryString.forEach(function(value, key) {
      if (!key.startsWith("utm_")) {
        deleteParams.push(key);
      }
    });
    deleteParams.forEach(function(value, key) {
      utmParamQueryString.delete(value);
    });

    if (utmParamQueryString) {
      // get all the links on the page
      document.querySelectorAll("a").forEach(function(item) {
        if (item.href && item.href != "") {
          const checkUrl = new URL(item.href);
          // if the links hrefs are not navigating to the same domain, then skip processing them
          if (checkUrl.host === location.host) {
            let doNotProcess = false;
            const linkSearchParams = new URLSearchParams(checkUrl.search);
            linkSearchParams.forEach(function(value, key) {
              if (key.startsWith("utm_")) doNotProcess = true;
            });
            if (doNotProcess) return;
            checkUrl.search = new URLSearchParams({
              ...Object.fromEntries(utmParamQueryString),
              ...Object.fromEntries(linkSearchParams),
            });
            item.href = checkUrl.href;
          }
        }
      });
    }
  },
  
  setupFormPrefill: function() {
    if (document.querySelector('#form-questionnaire-sante') !== null) {
      var questionnaireSante = document.querySelector('#form-questionnaire-sante');
      params = new URLSearchParams(document.location.search);
      params.forEach((value, key) => {
        var field = questionnaireSante.querySelector('input[name="' + key + '"]')
        if(field != null) {
          field.value = value
        }
      });
    }
  },
  
  setupFormValidation: function() {
    if (document.querySelector('#form-questionnaire-sante') !== null) {
      var questionnaireSante  = document.querySelector('#form-questionnaire-sante');
      var submitButton        = questionnaireSante.querySelector('button[type=submit]');
      var messageSucces       = document.querySelector('#message-success-questionnaire-sante');
      var modalErreur         = new BulmaModal("#md-erreur-questionnaire-sante");
      var detailsErreur       = modalErreur.elem.querySelector('#error-details');
      var messageIntroduction = document.querySelector('#introduction-questionnaire-sante');
      var fields              = questionnaireSante.querySelectorAll('input, select');
      var that                = this;

      questionnaireSante.addEventListener("submit", function(event) {
        var canSubmit = true;
        event.preventDefault();
        
        fields.forEach(function(field) {
          if (!field.validity.valid) {
            canSubmit = false;
            that._showInputFieldError(field);
          } else {
            that._showInputFieldValid(field);
          }
        });
        
        if (canSubmit) {
          submitButton.classList.add('is-loading');
          
          var xhr = new XMLHttpRequest();
          var formData = new FormData(questionnaireSante);
          
          xhr.open('POST', questionnaireSante.action);
          xhr.send(formData);
          xhr.onload = function() {
            if (xhr.status != 200) { // analyse l'état HTTP de la réponse
              submitButton.classList.remove('is-loading');
              detailsErreur.innerText = `Erreur ${xhr.status} : ${xhr.statusText}`;
              modalErreur.show();
            } else { // show the result
              submitButton.classList.remove('is-loading');
              window.scroll(0, 0);
              questionnaireSante.classList.add('is-hidden');
              messageIntroduction.classList.add('is-hidden');
              messageSucces.classList.remove('is-hidden');
            }
          };
          xhr.onerror = function() {
            submitButton.classList.remove('is-loading');
            modalErreur.show();
          };
          
        }
      });

      fields.forEach(function(field) {
        field.addEventListener("blur", (event) => {
          if (field.value != '') {
            if (field.validity.valid) {
              that._showInputFieldValid(field);
            } else {
              that._showInputFieldError(field);
            }
          } else {
            if (!that._hasInputFieldError(field)) {
              that._hideInputFieldInfos(field); 
            }
          }
        });
        field.addEventListener("input", (event) => {
          if (that._hasInputFieldError(field)) {
            if (field.validity.valid) {
              if (field.type == 'radio' && field.name != null && field.name != '') {
                var allRadioButtonsFromGroup = questionnaireSante.querySelectorAll('input[type="radio"][name="' + field.name + '"]');
                allRadioButtonsFromGroup.forEach(function(radio) {
                  that._showInputFieldValid(radio);
                });
              }
              if (field.type == 'checkbox' && field.name != null && field.name != '') {
                that._showInputFieldValid(field);
              }
            }
          }
          if (that._hasInputFieldValid(field)) {
            if (!field.validity.valid) {
              that._showInputFieldError(field);
            }
          }
        });
      });
     
    }
  },
  
  _hasInputFieldError: function(field) {
      return field.classList.contains("is-danger");
  },
  
  _hasInputFieldValid: function(field) {
      return field.classList.contains("is-success");
  },
  
  _hideInputFieldInfos: function(field) {
    if (field != null) {
      field.classList.remove("is-success");
      field.classList.remove("is-danger");
      
      if (field.nextElementSibling != null && field.nextElementSibling.firstElementChild != null) {
        icon = field.nextElementSibling.firstElementChild; // icone : <i class="fas"></i>
        icon.classList.remove("fa-check");
        icon.classList.remove("fa-exclamation-triangle");
      }
    }
  },
  
  _showInputFieldError: function(field) {
    if (field != null) {
      field.classList.remove("is-success");
      field.classList.add("is-danger");
      
      if (field.nextElementSibling != null && field.nextElementSibling.firstElementChild != null) {
        icon = field.nextElementSibling.firstElementChild; // icone : <i class="fas"></i>
        icon.classList.remove("fa-check");
        icon.classList.add("fa-exclamation-triangle");
      }
    }
  },
  
  _showInputFieldValid: function(field) {
    if (field != null) {
      field.classList.remove("is-danger");
      field.classList.add("is-success");

      if (field.nextElementSibling != null && field.nextElementSibling.firstElementChild != null) {
        icon = field.nextElementSibling.firstElementChild; // icone : <i class="fas"></i>
        icon.classList.remove("fa-exclamation-triangle");
        icon.classList.add("fa-check");
      }
    }
  },
  
  _selectNavigationItem: function(target) {
    var that = this;
    var item, selectedTab;
    if (target !== '') {
      item = that.hypnotherapyTabs.querySelector('a[data-target="' + target + '"]');
      // Mobile events
      that.hypnotherapyTabs.contentContainer.classList.remove('is-hidden-mobile');
      that.hypnotherapyTabs.tabsContainer.classList.add('is-hidden-mobile');
    } else {
      item = that.hypnotherapyTabs.querySelector('a');
      target = item.getAttribute("data-target");
      that.hypnotherapyTabs.contentContainer.classList.add('is-hidden-mobile');
      that.hypnotherapyTabs.tabsContainer.classList.remove('is-hidden-mobile');
    }
  
    if (item !== null) {
      selectedTab = that.hypnotherapyTabs.querySelector(target);
  
      that.hypnotherapyTabs.items.forEach(function(i) {
        i.classList.remove('is-active');
      });
      that.hypnotherapyTabs.tabs.forEach(function(t) {
        t.classList.remove('is-active');
      });
      item.classList.add('is-active');
      selectedTab.classList.add('is-active');
    }
  },
  
  _getUtmParams: function() {
    var utm_params = {
      utmCampaign: this.getParamFromCurrentPage("utm_campaign"),
      utmSource: this.getParamFromCurrentPage("utm_source"),
      utmMedium: this.getParamFromCurrentPage("utm_medium"),
      utmContent: this.getParamFromCurrentPage("gclid"), // Replacement of: this.getParamFromCurrentPage("utm_content"),
      utmTerm: this.getParamFromCurrentPage("utm_term")
      // Not Working: salesforce_uuid: this.getParamFromCurrentPage("gclid")
    }
    return utm_params;
  },
  
  _setCookie: function(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  },
  
  _getCookie: function(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  },
  
  _stickNavigation: function() {
    var that = this;
    that.sticky = {
      mainNavigation: that.navbars.main,
      relativeNavigation: that.navbars.relative,
      documentBody: document.body,
      whenToStick: that._findWhenToStickNavigation()
    };
  
    window.addEventListener('resize', function() {
      that.sticky.whenToStick = that._findWhenToStickNavigation();
      if (that.sticky.documentBody.classList.contains("has-relative-navbar-fixed-top")) {
        that.sticky.relativeNavigation.style.top = (that.sticky.mainNavigation.offsetHeight - 1) + "px";
      }
    });
  
    window.addEventListener('scroll', function() {
      if (!that.burgerButton.classList.contains('is-active')) { // Exécuter seulement si le menu mobile est inactif.
        if (that.sticky.documentBody.scrollTop > (that.sticky.whenToStick) || document.documentElement.scrollTop > (that.sticky.whenToStick)) {
          that.sticky.mainNavigation.classList.add("is-fixed-top");
          that.sticky.documentBody.classList.add("has-navbar-fixed-top");
  
          if (that.sticky.relativeNavigation != undefined && window.innerWidth > 768) { // Ne pas sticker sur mobile
            that.sticky.relativeNavigation.classList.add("is-fixed-top");
            that.sticky.relativeNavigation.style.top = (that.sticky.mainNavigation.offsetHeight - 1) + "px";
            that.sticky.documentBody.classList.add("has-relative-navbar-fixed-top");
          }
  
        } else {
          that.sticky.mainNavigation.classList.remove("is-fixed-top");
          that.sticky.documentBody.classList.remove("has-navbar-fixed-top");
  
          if (that.sticky.relativeNavigation != undefined && window.innerWidth > 768) { // Ne pas sticker sur mobile
            that.sticky.relativeNavigation.classList.remove("is-fixed-top");
            that.sticky.relativeNavigation.style.top = 0;
            that.sticky.documentBody.classList.remove("has-relative-navbar-fixed-top");
          }
        }
      }
    });
  },
  
  _loadNavbarsHeights: function() {
    this.navbarsHeights.secondary = this.navbars.secondary.offsetHeight;
    this.navbarsHeights.mainNavigation = this.navbars.main.querySelector('#main-navigation').offsetHeight;
    this.navbarsHeights.main = this.navbars.main.offsetHeight;
    this.navbarsHeights.mobileMenu = this.navbars.mobileNavbarBrand.querySelector('#mobile-navigation').offsetHeight;
  },
  
  _findWhenToStickNavigation: function() {
    var that = this;
    that._loadNavbarsHeights();
    var whenToStick = 0;
    if (that.navbarsHeights.secondary == 0) { // Vue mobile car la nav est masquée et sa hauteur = 0
      whenToStick = that.navbarsHeights.mainNavigation;
    } else {
      whenToStick = that.navbarsHeights.secondary;
    }
    return whenToStick;
  },
  
  
  _enableButtonBurger: function() {
    var that = this;
    var button = that.burgerButton;
  
    if (button !== null) {
      button.addEventListener("click", function() {
        // Get the target from the "data-target" attribute
        const target = button.dataset.target;
        const $target = document.getElementById(target);
        var isShowing = !button.classList.contains('is-active');
        var navIsFixed = that.sticky.mainNavigation.classList.contains('is-fixed-top');
  
        if (isShowing) {
          that.currentScroll = document.documentElement.scrollTop;
          document.body.classList.add('menu-active');
          if (!navIsFixed) {
            that.sticky.mainNavigation.classList.add("is-fixed-top");
          }
        } else {
          document.body.classList.remove('menu-active');
          that.sticky.mainNavigation.classList.remove("is-fixed-top");
          window.scrollBy(0, that.currentScroll);
        }
  
        button.classList.toggle('is-active');
        $target.classList.toggle('is-active');
  
      });
    }
  },

  respiration: {

    _runningTimer: null,
    _runningTimer2: null,

    run: function() {
      if (document.querySelector('#pg-respiration') !== null) {
        this.animations._load(this);
        this.sounds._load(this);
        this.buttons._load(this);
      }
    },

    startPause: function() {
      var that = this;
      if (that.animations.stopped) {
        that.animations.stopped = false;
        that.animations._setupIterationTimer();
        that.sounds._setupSoundTimers();
        that.play();
      } else {
        if (that.animations.paused) {
          that.play();
        } else {
          that.pause();
        }
      }
    },

    play: function() {
      var that = this;
      that.animations.play();
      that.sounds.play();
      that.buttons.play();
    },
    pause: function() {
      var that = this;
      that.animations.pause();
      that.sounds.pause();
      that.buttons.pause();
    },
    stop: function() {
      var that = this;
      that.sounds.stop();
      that.animations.stop();
      that.buttons.stop();
    },

    setRecurringTimer: function(callback, delay, initialStartDelay) {
      var timerId, start, remaining = delay;
      if (initialStartDelay >= 0) {
        remaining = initialStartDelay;
      }

      this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
      };

      this.stop = function() {
        window.clearTimeout(timerId);
      }

      var resume = function() {
        start = new Date();
        timerId = window.setTimeout(function() {
          remaining = delay;
          resume();
          callback();
        }, remaining);
      };

      this.resume = resume;
      this.resume();
    },

    animations: {
      main: null,
      progress: null,
      progressContainer: null,
      stopped: true,
      paused: true,
      newSpeed: null,
      _iterationTimer: null,
      _parent: null,

      _load: function(caller) {
        this._parent = caller;
        this.progressContainer = document.querySelector('#pg-track'),
          this.progress = document.querySelector('#pg-track .completed'),
          this.main = document.querySelector('#pg-respiration');

        var that = this;

        this.progress.addEventListener('animationend', function() {
          that._parent.stop();
        });

      },

      _setupIterationTimer: function(animationDuration) {
        var that = this;
        if (animationDuration == null) {
          animationDuration = parseInt(window.getComputedStyle(that.main, "::before").animationDuration);
        }
        that._iterationTimer = new that._parent.setRecurringTimer(function() {
          that.onAnimationIteration();
        }, animationDuration * 1000, 0);
        that._iterationTimer.pause();
      },

      onAnimationIteration: function() {
        var that = this;

        if (that.newSpeed != null && that.newSpeed > 0) {
          that._parent.sounds.updateSpeed(that.newSpeed)
          that.updateSpeed(that.newSpeed)
          that.newSpeed = null;

          var btSpeed = that._parent.buttons.configPanel.querySelector('.set-speed span.is-waiting');
          btSpeed.classList.remove("is-waiting");
          btSpeed.classList.add("is-active");
        }
      },
      play: function() {
        this._iterationTimer.resume();
        this.main.classList.remove("paused");
        this.progress.classList.add("running");
        this.paused = false;
      },
      pause: function() {
        this._iterationTimer.pause();
        this.main.classList.add("paused");
        this.progress.classList.remove("running");
        this.paused = true;
      },
      stop: function() {
        this._iterationTimer.stop();
        this.main.classList.remove("loader__bar", "paused");
        this.progress.classList.remove("running", "completed");
        void this.main.offsetWidth;
        this.main.classList.add("loader__bar", "paused");
        this.progress.classList.add("completed");
        this.stopped = true;
        this.paused = true;
      },
      updateSpeed: function(newSpeed) {
        this._iterationTimer.stop();
        this._setupIterationTimer(newSpeed * 2);
        this._iterationTimer.resume();

        this.main.classList.remove("loader__bar", "speed3sec", "speed4sec", "speed5sec", "speed6sec", "speed7sec");
        void this.main.offsetWidth;
        this.main.classList.add("speed" + newSpeed + "sec", "loader__bar");
      }
    },

    buttons: {
      playButton: null,
      stopButton: null,
      configButton: null,
      configPanel: null,
      _parent: null,

      _load: function(caller) {
        this._parent = caller;

        if (this._parent.animations.main !== null) {
          this.playButton = document.querySelector('#bt-respiration-start');
          this.stopButton = document.querySelector('#bt-respiration-stop');
          this.configButton = document.querySelector('#bt-config');
          this.configPanel = document.querySelector('#dp-config');

          var that = this,
            bt5min = that.configPanel.querySelector('#length5min'),
            bt10min = that.configPanel.querySelector('#length10min'),
            btinfinite = that.configPanel.querySelector('#lengthinfinite'),
            btSoundOn = that.configPanel.querySelector('#sound-on'),
            btSoundOff = that.configPanel.querySelector('#sound-off');

          that.playButton.addEventListener('click', function() {
            that._parent.startPause();
          });

          that.stopButton.addEventListener('click', function() {
            that._parent.stop();
          });

          that.configButton.addEventListener('click', function() {
            that.configButton.classList.toggle("is-active");
            that.configPanel.classList.toggle("is-active");
          });

          that.configPanel.querySelectorAll('.set-speed span.values span').forEach(function(btSpeed) {
            btSpeed.addEventListener('click', function() {
              var value = btSpeed.innerText;
              that._parent.animations.newSpeed = value;
              var activeButtons = that.configPanel.querySelector('.set-speed span.is-active');
              var waitingButtons = that.configPanel.querySelector('.set-speed span.is-waiting');
              if (activeButtons != null) {
                activeButtons.classList.remove("is-active");
              }
              if (waitingButtons != null) {
                waitingButtons.classList.remove("is-waiting");
              }
              btSpeed.classList.add("is-waiting");
            });
          });

          bt5min.addEventListener('click', function() {
            if (!bt5min.classList.contains("is-active")) {
              that._parent.animations.progress.classList.remove("length10min", "lengthinfinite");
              that._parent.animations.progress.classList.add("length5min");
              that._parent.animations.progressContainer.style.display = "block";
              that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
              bt5min.classList.add("is-active");
            }
          });

          bt10min.addEventListener('click', function() {
            if (!bt10min.classList.contains("is-active")) {
              that._parent.animations.progress.classList.remove("length5min", "lengthinfinite");
              that._parent.animations.progress.classList.add("length10min");
              that._parent.animations.progressContainer.style.display = "block";
              that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
              bt10min.classList.add("is-active");
            }
          });

          btinfinite.addEventListener('click', function() {
            if (!btinfinite.classList.contains("is-active")) {
              that._parent.animations.progress.classList.remove("length5min", "length10min");
              that._parent.animations.progress.classList.add("lengthinfinite")
              that._parent.animations.progressContainer.style.display = "none";
              that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
              btinfinite.classList.add("is-active");
            }
          });

          btSoundOn.addEventListener('click', function() {
            that._parent.sounds.mute = false;
            btSoundOff.classList.remove("is-active");
            btSoundOn.classList.add("is-active");
          });

          btSoundOff.addEventListener('click', function() {
            that._parent.sounds.mute = true;
            btSoundOn.classList.remove("is-active");
            btSoundOff.classList.add("is-active");
          });

        }
      },
      play: function() {
        this.playButton.classList.remove("paused");
        this.stopButton.classList.add("running");
        this.configButton.classList.add("running");
      },
      pause: function() {
        this.playButton.classList.add("paused");
        this.stopButton.classList.remove("running");
        this.configButton.classList.remove("running");
      },
      stop: function() {
        this.stopButton.classList.remove("running");
        this.configButton.classList.remove("running");
        this.playButton.classList.add("paused");
      }
    },

    sounds: {
      in: null,
      out: null,
      mute: false,
      _parent: null,

      _load: function(caller) {
        this._parent = caller;
        this.in = new Howl({
          src: ['/audio/in.mp3']
        });
        this.out = new Howl({
          src: ['/audio/out.mp3']
        });
      },
      _setupSoundTimers: function(animationDuration) {
        var that = this;
        if (animationDuration == null) {
          animationDuration = parseInt(window.getComputedStyle(that._parent.animations.main, "::before").animationDuration);
        }
        that._parent._runningTimer = new that._parent.setRecurringTimer(function() {
          if (!that.mute) {
            that.out.play();
          }
        }, animationDuration * 1000, 0); // ex. 10s pour un cycle total => 5000ms pour le deuxième son
        that._parent._runningTimer2 = new that._parent.setRecurringTimer(function() {
          if (!that.mute) {
            that.in.play();
          }
        }, animationDuration * 1000, animationDuration * 1000 / 2); // ex. 10s pour un cycle total => 5000ms pour le deuxième son
        that._parent._runningTimer.pause();
        that._parent._runningTimer2.pause();
      },
      play: function() {
        this._parent._runningTimer.resume();
        this._parent._runningTimer2.resume();
      },
      pause: function() {
        this._parent._runningTimer.pause();
        this._parent._runningTimer2.pause();
      },
      stop: function() {
        this._parent._runningTimer.stop();
        this._parent._runningTimer2.stop();
      },
      updateSpeed: function(newSpeed) {
        this.stop();
        this._setupSoundTimers(newSpeed * 2);
        this.play();
      }
    }
  }
}