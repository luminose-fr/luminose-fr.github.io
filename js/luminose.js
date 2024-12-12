(() => {
  // Gestion des événements d'historique et de changement d'URL
  const setupHistoryEventListeners = () => {
    const addHistoryEvent = (method) => {
      const original = history[method];
      history[method] = function () {
        const result = original.apply(this, arguments);
        window.dispatchEvent(new Event(method.toLowerCase()));
        window.dispatchEvent(new Event('locationchange'));
        return result;
      };
    };

    ['pushState', 'replaceState'].forEach(addHistoryEvent);

    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'));
    });
  };

  setupHistoryEventListeners();
})();

class BulmaModal {
  constructor(selector) {
    this.elem = document.querySelector(selector);
    if (!this.elem) throw new Error(`Modal element not found for selector: ${selector}`);
    this.initCloseEvents();
  }

  toggle() {
    this.elem.classList.toggle('is-active');
    this.dispatchEvent('modal:toggle');
  }

  show() {
    this.elem.classList.add('is-active');
    this.dispatchEvent('modal:show');
  }

  close() {
    this.elem.classList.remove('is-active');
    this.dispatchEvent('modal:close');
  }

  initCloseEvents() {
    const closeTriggers = this.elem.querySelectorAll("[data-bulma-modal='close'], .modal-background:not(.is-disabled)");
    closeTriggers.forEach(trigger => trigger.addEventListener('click', () => this.close()));
  }

  dispatchEvent(eventName) {
    this.elem.dispatchEvent(new Event(eventName));
  }

  on(event, callback) {
    this.elem.addEventListener(event, callback);
  }
}

// Main App
var App = {

  _config: {},

  init(config) {
    // Stocker les configurations passées
    this._config = {
      ...config,
      environment: config.environment || 'development',
      montants: {
        journee_rh: 16000,
      },
      keys: {
        rh: {
          stripe_public: "pk_test_jaaVMCX9nPpVoDs4KdUHKOZH00zzHDOBPo", // TEST
        }
      },
      urls: {
        calendly: {
          adulte: 'https://calendly.com/luminose/seance-hypnose?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
          enfant: 'https://calendly.com/luminose/seance-hypnose-enfant?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
          respiration: 'https://calendly.com/luminose/seance-respiration-holotropique?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
        },
        rh: {
          formulaire_paiment: window.location.origin + "/respiration-holotropique/inscription-etape-2.html",
          confirmation_paiment: window.location.origin + "/respiration-holotropique/inscription-etape-3.html",
          make_webhook_get_payment_intent: "https://hook.eu1.make.com/fwj3qqn7fcpnyo7m2anjw21esql2292k", // TEST
          stripe_script: "https://js.stripe.com/v3/",
        },
        futura_font: window.location.origin + "/fonts/5313918/55e6a203-1f50-4971-89d0-17ca0150f29d.woff",
      }
    };

    // if (this._config.environment == "production") {
    //   this._config.keys.stripe_public = "pk_live_P2BYIjcwyPoYiBqB9yHQYwAn00hWHz2vkg";
    //   this._config.urls.rh.make_webhook_get_payment_intent = "https://hook.eu1.make.com/269wcbq6nktemc3pvuuevkp7rbje1iny";
    // }

    // Appel automatique de la méthode `run` après l'initialisation
    this._run();
  },

  _run: function() {
    // console.log(`App running in ${this._config.environment} mode`);
    this.setupViewport();
    this.setupCookiesModal();
    this.setupNavigation();
    this.setupButtonPriseRdv();
    this.setupSocialLinks();
    this.setupButtonConfirmationQuestionnaireSante();
    this.setupUTMParamsPropagation();
    this.setupFormPrefill();
    this.setupFormValidation();
    this.setupPaiementAtelier();
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
            var url = new URL(item.getAttribute("href"));
            var hash = url.hash;
            event.preventDefault();
            selectedItem = tabsContainer.querySelector('a[href="' + url.href + '"]');
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

  setupButtonPriseRdv() {
    const modal = new BulmaModal('#md-prise-rdv');
    const buttons = document.querySelectorAll('.bt-prise-rdv');
    const utmParams = this._getUtmParams();

    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        modal.show();
      });
    });

    Object.entries(this._config.urls.calendly).forEach(([key, url]) => {
      const button = document.querySelector(`#bt-seance-${key}`);
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          modal.close();
          Calendly.initPopupWidget({ url, utm: utmParams });
        });
      }
    });

    if (window.location.hash === '#prise-rdv') {
      // event.preventDefault;
      modal.show();
      var uri = window.location.toString();
      if (uri.indexOf("#") > 0) {
        var clean_uri = uri.substring(0, uri.indexOf("#"));
        window.history.replaceState({}, document.title, clean_uri);
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
        var field = questionnaireSante.querySelector('[name="' + key + '"]')
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
      var urlEtapeDeux        = this._config.urls.rh.formulaire_paiment;
      var estAvecDeuxEtapes   = false;
      if (questionnaireSante.classList.contains('inscription-etape-1')) {
        var estAvecDeuxEtapes = true;
      }

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
          const formData = new FormData(questionnaireSante);

          submitButton.classList.add('is-loading');

          fetch(questionnaireSante.action, {
            method: 'POST',
            body: formData,
          })
            .then(async (response) => {
              submitButton.classList.remove('is-loading');

              if (!response.ok) {
                const errorText = response.status === 400 
                  ? `Erreur ${response.status} : Le formulaire est incomplet ou les données ne sont pas valides.` 
                  : `Erreur ${response.status} : ${response.statusText}`;
                  
                detailsErreur.innerText = errorText;
                modalErreur.show();
                return;
              }

              // Si la réponse est OK
              if (estAvecDeuxEtapes) {
                const urlWithParams = new URL(urlEtapeDeux);
                urlWithParams.searchParams.append("prenom", formData.get("coordonnees_participant[prenom]"));
                urlWithParams.searchParams.append("nom", formData.get("coordonnees_participant[nom]"));
                urlWithParams.searchParams.append("code_postal", formData.get("coordonnees_participant[code_postal]"));
                urlWithParams.searchParams.append("email", formData.get("coordonnees_participant[email]"));
                urlWithParams.searchParams.append("telephone", formData.get("coordonnees_participant[telephone]"));
                urlWithParams.searchParams.append("ville", formData.get("coordonnees_participant[ville]"));
                urlWithParams.searchParams.append("notion_page_id", formData.get("notion_page_id"));
                window.location.href = urlWithParams.href;
              } else {
                window.scroll(0, 0);
                questionnaireSante.classList.add('is-hidden');
                messageIntroduction.classList.add('is-hidden');
                messageSucces.classList.remove('is-hidden');
              }
            })
            .catch(() => {
              submitButton.classList.remove('is-loading');
              modalErreur.show();
            });
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

  setupPaiementAtelier: function() {
    if (document.querySelector('#conditions-annulation') !== null) {
      var checkboxConditionsAnnulation  = document.querySelector('#conditions-annulation');
      var optionsPaiements = document.querySelector('#options-paiement');
      optionsPaiements.stripeLoaded = false;
      optionsPaiements.stripeForm   = optionsPaiements.querySelector('#form-stripe-elements');
      optionsPaiements.submitButton = optionsPaiements.querySelector('button[type=submit]');
      optionsPaiements.fieldset     = optionsPaiements.querySelector('fieldset');
      
      optionsPaiements.enable = async function() {
        if (!optionsPaiements.stripeLoaded) {
          await that._loadStripeScript();
          that._loadStripeElements(optionsPaiements);
          optionsPaiements.stripeLoaded = true;
        }
        optionsPaiements.classList.remove("is-disabled");
        optionsPaiements.fieldset.disabled = false;
      };
      optionsPaiements.disable = function() {
        optionsPaiements.classList.add("is-disabled");
        optionsPaiements.fieldset.disabled = true;
      };
      var that = this;
      checkboxConditionsAnnulation.addEventListener("input", (event) => {
        if (checkboxConditionsAnnulation.checked) {          
          optionsPaiements.enable();
        } else {
          optionsPaiements.disable();
        }
      });
    }
  },
  _loadStripeScript: function() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this._config.urls.rh.stripe_script;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe script'));
      document.head.appendChild(script);
    });
  },

  _loadStripeElements: async function (optionsPaiements) {
    const { keys, urls } = this._config;
    const divDonneesInscription = document.querySelector('#donnees-inscription');
    const stripe = Stripe(keys.rh.stripe_public);
    const queryStringParams = new URLSearchParams(window.location.search);
    const metadata = { notion_page_id: decodeURIComponent(queryStringParams.get("notion_page_id")) };
    const futuraFontUrl = urls.futura_font;
    const appearance = {
      theme: 'stripe',
      variables: { 
        colorPrimary: '#6163A5',
        fontFamily: '"Futura LT W05 Book", sans-serif',
        fontWeightLight: '300',
        borderRadius: '8px',
      }
    };
    
    const billingDetails = this._getBillingDetails(queryStringParams);
    const donneesCompletes = this._areBillingDetailsComplete(billingDetails); 
    const clientSecret = await this._createPaymentIntent(urls.rh.make_webhook_get_payment_intent, metadata);
  
    if (!clientSecret) return;
  
    const elements = stripe.elements({ 
      clientSecret, 
      loader: 'auto', 
      appearance, 
      fonts: [
                {
                  family: "Futura LT W05 Book",
                  src: `url(${futuraFontUrl})`,
                  weight: "500",
                },
      ]
    });
    const paymentElement = elements.create('payment', {
      layout: 'accordion',
      fields: { billingDetails: this._getBillingDetailsFields(donneesCompletes) },
      defaultValues: { billingDetails: donneesCompletes ? billingDetails : {} },
    });
  
    paymentElement.mount('#payment-element');
  
    if (!donneesCompletes) {
      const addressElement = elements.create('address', { mode: 'billing' });
      addressElement.mount('#address-element');
    }
  
    this._setupFormSubmission(elements, stripe, optionsPaiements, billingDetails, urls.rh.confirmation_paiment);
  },
  
  _getBillingDetails: function (queryStringParams) {
    const extractValue = (key) => {
      const value = decodeURIComponent(queryStringParams.get(key) || "").trim();
      return value || null; // Retourne null si la valeur est vide
    };
  
    const email = extractValue("email");
    const prenom = extractValue("prenom");
    const nom = extractValue("nom");
    const phone = extractValue("telephone");
    const city = extractValue("ville");
    const postal_code = extractValue("code_postal");
  
    const billingDetails = {};
    if (email) billingDetails.email = email;
    if (prenom || nom) billingDetails.name = `${prenom || ""} ${nom || ""}`.trim();
    if (phone) billingDetails.phone = phone;
  
    billingDetails.address = {};
    if (city) billingDetails.address.city = city;
    if (postal_code) billingDetails.address.postal_code = postal_code;
    billingDetails.address.country = "FR"; // Toujours défini
  
    return billingDetails;
  },
  
  _areBillingDetailsComplete: function (billingDetails) {
    return (
      billingDetails.email &&
      billingDetails.name &&
      billingDetails.phone &&
      billingDetails.address?.city &&
      billingDetails.address?.postal_code
    );
  },
  
  _getBillingDetailsFields: function (donneesCompletes) {
    return donneesCompletes
      ? { email: 'never', name: 'never', phone: 'never' }
      : {};
  },
  
  _createPaymentIntent: async function (url, metadata) {
    const montant_journee_rh = this._config.montants.journee_rh;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: montant_journee_rh,
          currency: "eur",
          metadata,
        }),
      });
  
      const { clientSecret, error } = await response.json();
      if (error) {
        console.error("Erreur lors de la création du PaymentIntent:", error.message);
        return null;
      }
  
      // console.log("Client secret reçu.");
      return clientSecret;
    } catch (err) {
      console.error("Erreur lors de la requête au backend:", err);
      return null;
    }
  },
  
  _setupFormSubmission: function (elements, stripe, optionsPaiements, billingDetails, returnUrl) {
    const form = optionsPaiements.stripeForm;
    let submitted = false;
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitted) return;
  
      submitted = true;
      optionsPaiements.fieldset.disabled = true;
  
      try {
        // console.log("Envoi des billingDetails:", billingDetails);
  
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: returnUrl,
            payment_method_data: { billing_details: billingDetails },
          },
        });
  
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Erreur lors de la confirmation de paiement:", err.message);
        submitted = false;
        optionsPaiements.fieldset.disabled = false;
      }
    });
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