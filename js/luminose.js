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
    var modalClose = this.elem.querySelectorAll("[data-bulma-modal='close'], .modal-background")
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
    this.setupNavigation();
    this.setupButtonPriseRdv();
    this.setupSocialLinks();
    this.respiration.run();
  },

  setupViewport: function() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.addEventListener('resize', function () {
      var vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
  },

  setupNavigation: function() {
    if (this.navbar == null) {
      this.navbar = document.getElementById("main-navbar");
      this.burgerButton = document.querySelector('#bt-navigation');
    }
    if (this.navbar !== null) {
      this.navbarMenuHeight = document.getElementById('main-navigation').offsetHeight;
      this.navbarMobileMenuHeight = document.getElementById('mobile-navigation').offsetHeight;
      this.navbarHeight = this.navbar.offsetHeight;
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
          // that._selectNavigationItem(item.getAttribute("href"));
          history.pushState({}, '', item.getAttribute("href"));
        });
      });

      // Load the good tab depending on anchor and scroll accorgingly
      var realblockHeight = that.navbarHeight - that.navbarMenuHeight - that.navbarMobileMenuHeight;
      var elementPosition = that.hypnotherapyTabs.getBoundingClientRect().top;
      var offsetPosition = elementPosition + window.pageYOffset - realblockHeight;

      if (window.location.hash !== '' && window.location.hash !== '#prise-rdv') {
        that._selectNavigationItem(window.location.hash)
        setTimeout(function() {
          window.scrollTo({
               top: offsetPosition,
               behavior: "smooth"
          });
        }, 5);
      }

      // Setup mobile button for Tabs menu
      var mobileTabsButton = that.hypnotherapyTabs.querySelector('#mobile-tabs-toggle');
      if (mobileTabsButton !== null) {
        mobileTabsButton.addEventListener("click", function () {
          that.hypnotherapyTabs.contentContainer.classList.add('is-hidden-mobile');
          that.hypnotherapyTabs.tabsContainer.classList.remove('is-hidden-mobile');
          // console.log(window.location);
          history.pushState({}, '', window.location.origin + window.location.pathname);
        });
      }

      // Track URL change (<previous | next> from browser)
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

  _selectNavigationItem: function(hash) {
    var that = this;
    var item, selectedTab;
    if (hash !== '') {
      item = that.hypnotherapyTabs.querySelector('a[href="' + hash + '"]');
      // Mobile events
      that.hypnotherapyTabs.contentContainer.classList.remove('is-hidden-mobile');
      that.hypnotherapyTabs.tabsContainer.classList.add('is-hidden-mobile');
    } else {
      item = that.hypnotherapyTabs.querySelector('a');
      hash = item.getAttribute("href");
      that.hypnotherapyTabs.contentContainer.classList.add('is-hidden-mobile');
      that.hypnotherapyTabs.tabsContainer.classList.remove('is-hidden-mobile');
    }
    
    if (item !== null) {
      selectedTab = that.hypnotherapyTabs.querySelector(hash);
  
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
        utmContent: this.getParamFromCurrentPage("utm_content"),
        utmTerm: this.getParamFromCurrentPage("utm_term")
    }
    return utm_params;
  },
  
  setupButtonPriseRdv: function() {
    if (document.querySelector('#md-prise-rdv') !== null) {
      var modal = new BulmaModal("#md-prise-rdv");
      var that = this;
      var btSeanceAdulte = document.querySelector('#bt-seance-adulte');
      var btSeanceCouple = document.querySelector('#bt-seance-couple');
      var btSeanceEnfant = document.querySelector('#bt-seance-enfant');
      
      var buttons = document.querySelectorAll('.bt-prise-rdv');
      buttons.forEach(function(button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          modal.show();
        });
      });
      
      if (btSeanceAdulte !== null) {
        btSeanceAdulte.addEventListener("click", function (event) {
          event.preventDefault();
          modal.close();
          Calendly.initPopupWidget({
            url: 'https://calendly.com/luminose/seance-hypnose?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
            utm: that._getUtmParams() 
          });        
        });
      }
      
      if (btSeanceCouple !== null) {
        btSeanceCouple.addEventListener("click", function (event) {
          event.preventDefault();
          modal.close();
          Calendly.initPopupWidget({
            url: 'https://calendly.com/luminose/seance-hypnose-couple?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
            utm: that._getUtmParams()
          });        
        });
      }
      
      if (btSeanceEnfant !== null) {
        btSeanceEnfant.addEventListener("click", function (event) {
          event.preventDefault();
          modal.close();
          Calendly.initPopupWidget({
            url: 'https://calendly.com/luminose/seance-hypnose-enfant?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
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
  
  getParamFromCurrentPage: function(param_name) {
    param_name = param_name.replace(/([\[\]])/g,"\\\$1");
    var regex = new RegExp("[\\?&]"+param_name+"=([^&#]*)"), 
      results = regex.exec( window.location.href );
    return results? results[1]:"";
  },

  _stickNavigation: function() {
    var that = this;
    window.addEventListener('scroll', function () {
      // var realblockHeight = that.navbarHeight - that.navbarMenuHeight - that.navbarMobileMenuHeight;
      // setTimeout(function() {
      //   window.scrollTo({
      //        top: offsetPosition,
      //        behavior: "smooth"
      //   });
      // }, 5);
      var realblockHeight = 156;
      if (!that.burgerButton.classList.contains('is-active')) {

        // console.log("Scroll top: " + document.documentElement.scrollTop);
        // console.log("realblockHeight: " + realblockHeight);
        if (document.body.scrollTop > (realblockHeight) || document.documentElement.scrollTop > (realblockHeight)) {
          that.navbar.classList.add("is-fixed-top");
          document.body.style.padding = (realblockHeight + 72) + "px 0 0 0";
        } else {
          that.navbar.classList.remove("is-fixed-top");
          document.body.style.padding = "0";
        }
      }
    });
  },

  _enableButtonBurger: function() {
    var that = this;
    var button = that.burgerButton;

    if (button !== null) {
      button.addEventListener("click", function () {
        // Get the target from the "data-target" attribute
        const target = button.dataset.target;
        const $target = document.getElementById(target);
        var isShowing = !button.classList.contains('is-active');
        var navIsFixed = that.navbar.classList.contains('is-fixed-top');

        if (isShowing) {
          that.currentScroll = document.documentElement.scrollTop;
          document.body.classList.add('menu-active');
          // console.log("Opening------");
          // console.log("Current scroll : " + that.currentScroll);
          if (!navIsFixed) {
            that.navbar.classList.add("is-fixed-top");
          }
        } else {
          // console.log("Closing------");
          document.body.classList.remove('menu-active');
          that.navbar.classList.remove("is-fixed-top");
          // console.log("Scroll to : " + that.currentScroll);
          window.scrollBy(0, that.currentScroll);
          // currentScroll = 0;
        }

        button.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    }
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

    startPause:function() {
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

    play:function() {
      var that = this;
      that.animations.play();
      that.sounds.play();
      that.buttons.play();
    },
    pause:function() {
      var that = this;
      that.animations.pause();
      that.sounds.pause();
      that.buttons.pause();
    },
    stop:function() {
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

      _setupIterationTimer: function(animationDuration){
        var that = this;
        if (animationDuration == null) {
          animationDuration = parseInt(window.getComputedStyle(that.main, "::before").animationDuration);
        }
        that._iterationTimer = new that._parent.setRecurringTimer(function () {
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
        this._setupIterationTimer(newSpeed*2);
        this._iterationTimer.resume();

        this.main.classList.remove("loader__bar","speed3sec", "speed4sec", "speed5sec", "speed6sec", "speed7sec");
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
          this.playButton   = document.querySelector('#bt-respiration-start');
          this.stopButton   = document.querySelector('#bt-respiration-stop');
          this.configButton = document.querySelector('#bt-config');
          this.configPanel  = document.querySelector('#dp-config');

          var that = this,
              bt5min = that.configPanel.querySelector('#length5min'),
              bt10min = that.configPanel.querySelector('#length10min'),
              btinfinite = that.configPanel.querySelector('#lengthinfinite'),
              btSoundOn = that.configPanel.querySelector('#sound-on'),
              btSoundOff = that.configPanel.querySelector('#sound-off');

          that.playButton.addEventListener('click', function () {
            that._parent.startPause();
          });

          that.stopButton.addEventListener('click', function () {
            that._parent.stop();
          });

          that.configButton.addEventListener('click', function () {
            that.configButton.classList.toggle("is-active");
            that.configPanel.classList.toggle("is-active");
          });

          that.configPanel.querySelectorAll('.set-speed span.values span').forEach(function(btSpeed) {
            btSpeed.addEventListener('click', function () {
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

          bt5min.addEventListener('click', function () {
            if (!bt5min.classList.contains("is-active")) {
              that._parent.animations.progress.classList.remove("length10min", "lengthinfinite");
              that._parent.animations.progress.classList.add("length5min");
              that._parent.animations.progressContainer.style.display = "block";
              that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
              bt5min.classList.add("is-active");
            }
          });

          bt10min.addEventListener('click', function () {
            if (!bt10min.classList.contains("is-active")) {
              that._parent.animations.progress.classList.remove("length5min", "lengthinfinite");
              that._parent.animations.progress.classList.add("length10min");
              that._parent.animations.progressContainer.style.display = "block";
              that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
              bt10min.classList.add("is-active");
            }
          });

          btinfinite.addEventListener('click', function () {
            if (!btinfinite.classList.contains("is-active")) {
              that._parent.animations.progress.classList.remove("length5min", "length10min");
              that._parent.animations.progress.classList.add("lengthinfinite")
              that._parent.animations.progressContainer.style.display = "none";
              that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
              btinfinite.classList.add("is-active");
            }
          });

          btSoundOn.addEventListener('click', function () {
            that._parent.sounds.mute = false;
            btSoundOff.classList.remove("is-active");
            btSoundOn.classList.add("is-active");
          });

          btSoundOff.addEventListener('click', function () {
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
        that._parent._runningTimer = new that._parent.setRecurringTimer(function () {
          if (!that.mute) {
            that.out.play();
          }
        }, animationDuration*1000, 0); // ex. 10s pour un cycle total => 5000ms pour le deuxième son
        that._parent._runningTimer2 = new that._parent.setRecurringTimer(function () {
          if (!that.mute) {
            that.in.play();
          }
        }, animationDuration*1000, animationDuration*1000/2); // ex. 10s pour un cycle total => 5000ms pour le deuxième son
        that._parent._runningTimer.pause();
        that._parent._runningTimer2.pause();
      },
      play: function() {
        this._parent._runningTimer.resume();
        this._parent._runningTimer2.resume();
      },
      pause:function() {
        this._parent._runningTimer.pause();
        this._parent._runningTimer2.pause();
      },
      stop:function() {
        this._parent._runningTimer.stop();
        this._parent._runningTimer2.stop();
      },
      updateSpeed: function(newSpeed) {
        this.stop();
        this._setupSoundTimers(newSpeed*2);
        this.play();
      }
    }
  }
}
