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
        progressbar = document.querySelector('#pg-respiration');

    if ((buttonStart !== null) && (buttonStop !== null) && (progressbar !== null)) {
      buttonStart.addEventListener('click', function () {
        progressbar.classList.toggle("paused");
        buttonStart.classList.toggle("paused");
        buttonStop.classList.toggle("running");
      });
      buttonStop.addEventListener('click', function () {
        progressbar.classList.remove("loader__bar");
        progressbar.classList.remove("paused");
        buttonStop.classList.remove("running");
        void progressbar.offsetWidth;
        progressbar.classList.add("loader__bar");
        progressbar.classList.add("paused");
        buttonStart.classList.add("paused");
      });
      var before = window.getComputedStyle(progressbar, '::before');
      var iterationsCount = before.getPropertyValue('animation-iteration-count');
      // console.log(iterationsCount);
    }
  }
}
