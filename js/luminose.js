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
    this._loadRespirationControls();
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

  _loadRespirationControls: function() {
    var buttonStart = document.querySelector('#bt-respiration-start'),
        buttonStop  = document.querySelector('#bt-respiration-stop'),
        buttonConfig  = document.querySelector('#bt-config'),
        dropdownConfig  = document.querySelector('#dp-config'),
        tracker = document.querySelector('#pg-track'),
        progressbarTracker = document.querySelector('#pg-track .completed'),
        progressbar = document.querySelector('#pg-respiration');

    if ((buttonStart !== null) && (buttonStop !== null) && (buttonConfig !== null) && (dropdownConfig !== null) && (progressbar !== null)) {
      buttonStart.addEventListener('click', function () {
        progressbar.classList.toggle("paused");
        progressbarTracker.classList.toggle("running");
        buttonStart.classList.toggle("paused");
        buttonStop.classList.toggle("running");
        buttonConfig.classList.toggle("running");
      });
      buttonStop.addEventListener('click', function () {
        progressbar.classList.remove("loader__bar", "paused");
        progressbarTracker.classList.remove("running", "completed");
        buttonStop.classList.remove("running");
        buttonConfig.classList.remove("running");
        iterationsCounter = 0;
        void progressbar.offsetWidth;
        progressbar.classList.add("loader__bar", "paused");
        progressbarTracker.classList.add("completed");
        buttonStart.classList.add("paused");
      });
      buttonConfig.addEventListener('click', function () {
        buttonConfig.classList.toggle("is-active");
        dropdownConfig.classList.toggle("is-active");
      });
      dropdownConfig.querySelectorAll('.set-speed span.values span').forEach(function(btSpeed) {
        btSpeed.addEventListener('click', function () {
          var value = btSpeed.innerText;
          progressbar.classList.remove("speed3sec", "speed4sec", "speed5sec", "speed6sec", "speed7sec");
          progressbar.classList.add("speed" + value + "sec");
          dropdownConfig.querySelector('.set-speed span.is-active').classList.remove("is-active");
          btSpeed.classList.add("is-active");
        });
      })
      progressbar.addEventListener('animationend', function() {
        buttonStop.click();
      });

      var bt5min = dropdownConfig.querySelector('#length5min'),
          bt10min = dropdownConfig.querySelector('#length10min'),
          btinfinite = dropdownConfig.querySelector('#lengthinfinite');
      bt5min.addEventListener('click', function () {
        if (!bt5min.classList.contains("is-active")) {
          progressbar.classList.remove("length10min", "lengthinfinite");
          progressbarTracker.classList.remove("length10min", "lengthinfinite");
          progressbar.classList.add("length5min");
          progressbarTracker.classList.add("length5min");
          tracker.style.display = "block";
          dropdownConfig.querySelector('.set-length span.is-active').classList.remove("is-active");
          bt5min.classList.add("is-active");
        }
      });
      bt10min.addEventListener('click', function () {
        if (!bt10min.classList.contains("is-active")) {
          progressbar.classList.remove("length5min", "lengthinfinite");
          progressbarTracker.classList.remove("length5min", "lengthinfinite");
          progressbar.classList.add("length10min");
          progressbarTracker.classList.add("length10min");
          tracker.style.display = "block";
          dropdownConfig.querySelector('.set-length span.is-active').classList.remove("is-active");
          bt10min.classList.add("is-active");
        }
      });
      btinfinite.addEventListener('click', function () {
        if (!btinfinite.classList.contains("is-active")) {
          progressbar.classList.remove("length5min", "length10min");
          progressbarTracker.classList.remove("length5min", "length10min");
          progressbar.classList.add("lengthinfinite");
          progressbarTracker.classList.add("lengthinfinite")
          tracker.style.display = "none";
          dropdownConfig.querySelector('.set-length span.is-active').classList.remove("is-active");
          btinfinite.classList.add("is-active");
        }
      });

    }
  }
}
