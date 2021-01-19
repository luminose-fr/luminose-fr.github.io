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
    this._setupViewport();
    this._enableButtonMentionsLegales();
    this.respiration.run();
  },

  _setupViewport: function() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.addEventListener('resize', function () {
      var vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
  },

  _enableButtonMentionsLegales: function() {
    var button = document.querySelector('#bt-mentions-legales');
    if (button !== null) {
      var modal = new BulmaModal("#md-mentions-legales");
      button.addEventListener("click", function () {
      	modal.show();
      });
    }
  },

  respiration: {

    _runningTimer: null,
    _runningTimer2: null,

    run: function() {
      this.animations._load(this);
      this.sounds._load(this);
      this.buttons._load(this);
    },

    startPause:function() {
      var that = this;
      if (that.animations.stopped) {
        that.animations.stopped = false;
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
      that.animations.main.classList.remove("paused");
      that.animations.progress.classList.add("running");
      that.buttons.play.classList.remove("paused");
      that.buttons.stop.classList.add("running");
      that.buttons.config.classList.add("running");
      that.sounds.play();
      that.animations.paused = false;
    },

    pause:function() {
      var that = this;
      that.animations.main.classList.add("paused");
      that.animations.progress.classList.remove("running");
      that.buttons.play.classList.add("paused");
      that.buttons.stop.classList.remove("running");
      that.buttons.config.classList.remove("running");
      that.sounds.pause();
      that.animations.paused = true;
    },

    stop:function() {
      var that = this;
      that.sounds.stop();
      that.animations.main.classList.remove("loader__bar", "paused");
      that.animations.progress.classList.remove("running", "completed");
      that.buttons.stop.classList.remove("running");
      that.buttons.config.classList.remove("running");
      void that.animations.main.offsetWidth;
      that.animations.main.classList.add("loader__bar", "paused");
      that.animations.progress.classList.add("completed");
      that.buttons.play.classList.add("paused");
      that.animations.stopped = true;
      that.animations.paused = true;
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
      _parent: null,

      _load: function(caller) {
        this._parent = caller;
        this.progressContainer = document.querySelector('#pg-track'),
        this.progress = document.querySelector('#pg-track .completed'),
        this.main = document.querySelector('#pg-respiration');

        var that = this;

        this.main.addEventListener('animationend', function() {
          console.log('end');
          that._parent.stop();
        });

        // this.main.addEventListener('animationiteration', function() {
        //   console.log('iteration');
        //   that._parent._onIteration();
        // });
      }
    },

    buttons: {
      play: null,
      stop: null,
      config: null,
      configPanel: null,
      _parent: null,

      _load: function(caller) {
        this._parent = caller;

        if (this._parent.animations.main !== null) {
          this.play         = document.querySelector('#bt-respiration-start');
          this.stop         = document.querySelector('#bt-respiration-stop');
          this.config       = document.querySelector('#bt-config');
          this.configPanel  = document.querySelector('#dp-config');

          if ((this.play !== null) && (this.stop !== null) && (this.config !== null) && (this.configPanel !== null)) {

            var that = this,
                bt5min = that.configPanel.querySelector('#length5min'),
                bt10min = that.configPanel.querySelector('#length10min'),
                btinfinite = that.configPanel.querySelector('#lengthinfinite');

            that.play.addEventListener('click', function () {
              that._parent.startPause();
            });

            that.stop.addEventListener('click', function () {
              that._parent.stop();
            });

            that.config.addEventListener('click', function () {
              that.config.classList.toggle("is-active");
              that.configPanel.classList.toggle("is-active");
            });

            that.configPanel.querySelectorAll('.set-speed span.values span').forEach(function(btSpeed) {
              btSpeed.addEventListener('click', function () {
                ////////
                ///////
                //////
                /////
                //// A revoir avec le son + ajouter [mute] en config
                var value = btSpeed.innerText;
                that._parent.animations.main.classList.remove("speed3sec", "speed4sec", "speed5sec", "speed6sec", "speed7sec");
                that._parent.animations.main.classList.add("speed" + value + "sec");
                that.configPanel.querySelector('.set-speed span.is-active').classList.remove("is-active");
                btSpeed.classList.add("is-active");
              });
            });

            bt5min.addEventListener('click', function () {
              if (!bt5min.classList.contains("is-active")) {
                that._parent.animations.main.classList.remove("length10min", "lengthinfinite");
                that._parent.animations.progress.classList.remove("length10min", "lengthinfinite");
                that._parent.animations.main.classList.add("length5min");
                that._parent.animations.progress.classList.add("length5min");
                that._parent.animations.progressContainer.style.display = "block";
                that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
                bt5min.classList.add("is-active");
              }
            });

            bt10min.addEventListener('click', function () {
              if (!bt10min.classList.contains("is-active")) {
                that._parent.animations.main.classList.remove("length5min", "lengthinfinite");
                that._parent.animations.progress.classList.remove("length5min", "lengthinfinite");
                that._parent.animations.main.classList.add("length10min");
                that._parent.animations.progress.classList.add("length10min");
                that._parent.animations.progressContainer.style.display = "block";
                that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
                bt10min.classList.add("is-active");
              }
            });

            btinfinite.addEventListener('click', function () {
              if (!btinfinite.classList.contains("is-active")) {
                that._parent.animations.main.classList.remove("length5min", "length10min");
                that._parent.animations.progress.classList.remove("length5min", "length10min");
                that._parent.animations.main.classList.add("lengthinfinite");
                that._parent.animations.progress.classList.add("lengthinfinite")
                that._parent.animations.progressContainer.style.display = "none";
                that.configPanel.querySelector('.set-length span.is-active').classList.remove("is-active");
                btinfinite.classList.add("is-active");
              }
            });
          }
        }
      }
    },

    sounds: {
      in: null,
      out: null,
      _parent: null,

      _load: function(caller) {
        this._parent = caller;
        this.in = new Howl({
          src: ['/audio/in.wav']
        });
        this.out = new Howl({
          src: ['/audio/out.wav']
        });
      },
      _setupSoundTimers: function() {
        var that = this;
        var animationDuration = parseInt(window.getComputedStyle(that._parent.animations.main, "::before").animationDuration);
        that._parent._runningTimer = new that._parent.setRecurringTimer(function () {
            that.out.play();
        }, animationDuration*1000, 0); // ex. 10s pour un cycle total => 5000ms pour le deuxième son
        that._parent._runningTimer2 = new that._parent.setRecurringTimer(function () {
            that.in.play();
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
      }
      // _onIteration:function() {
      //   var that = this,
      //       animationDuration = parseInt(window.getComputedStyle(that.animations.main, "::before").animationDuration);
      //
      //   that.sounds.in.play();
      //
      //   that._runningTimer = new that.setTimer(function () {
      //       that.sounds.out.play();
      //   }, (animationDuration/2)*1000); // ex. 10s pour un cycle total => 5000ms pour le deuxième son
      // }
    }
  }
}
