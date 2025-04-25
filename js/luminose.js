// zoom-vanilla.js - 2.0.6 (https://github.com/spinningarrow/zoom-vanilla.js)
+function(){"use strict";function e(e){var t=e.getBoundingClientRect(),n=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0,o=window.pageXOffset||document.documentElement.scrollLeft||document.body.scrollLeft||0;return{top:t.top+n,left:t.left+o}}var t=80,n=function(){function n(){var e=document.createElement("img");e.onload=function(){d=Number(e.height),l=Number(e.width),o()},e.src=m.currentSrc||m.src}function o(){f=document.createElement("div"),f.className="zoom-img-wrap",f.style.position="absolute",f.style.top=e(m).top+"px",f.style.left=e(m).left+"px",v=m.cloneNode(),v.style.visibility="hidden",m.style.width=m.offsetWidth+"px",m.parentNode.replaceChild(v,m),document.body.appendChild(f),f.appendChild(m),m.classList.add("zoom-img"),m.setAttribute("data-action","zoom-out"),c=document.createElement("div"),c.className="zoom-overlay",document.body.appendChild(c),i(),r()}function i(){m.offsetWidth;var e=l,n=d,o=e/m.width,i=window.innerHeight-t,r=window.innerWidth-t,s=e/n,a=r/i;u=e<r&&n<i?o:s<a?i/n*o:r/e*o}function r(){m.offsetWidth;var t=e(m),n=window.pageYOffset,o=n+window.innerHeight/2,i=window.innerWidth/2,r=t.top+m.height/2,s=t.left+m.width/2,a=Math.round(o-r),d=Math.round(i-s),l="scale("+u+")",c="translate("+d+"px, "+a+"px) translateZ(0)";m.style.webkitTransform=l,m.style.msTransform=l,m.style.transform=l,f.style.webkitTransform=c,f.style.msTransform=c,f.style.transform=c,document.body.classList.add("zoom-overlay-open")}function s(){if(document.body.classList.remove("zoom-overlay-open"),document.body.classList.add("zoom-overlay-transitioning"),m.style.webkitTransform="",m.style.msTransform="",m.style.transform="",f.style.webkitTransform="",f.style.msTransform="",f.style.transform="",!1 in document.body.style)return a();f.addEventListener("transitionend",a),f.addEventListener("webkitTransitionEnd",a)}function a(){m.removeEventListener("transitionend",a),m.removeEventListener("webkitTransitionEnd",a),f&&f.parentNode&&(m.classList.remove("zoom-img"),m.style.width="",m.setAttribute("data-action","zoom"),v.parentNode.replaceChild(m,v),f.parentNode.removeChild(f),c.parentNode.removeChild(c),document.body.classList.remove("zoom-overlay-transitioning"))}var d=null,l=null,c=null,u=null,m=null,f=null,v=null;return function(e){return m=e,{zoomImage:n,close:s,dispose:a}}}();(function(){function e(){document.body.addEventListener("click",function(e){"zoom"===e.target.getAttribute("data-action")&&"IMG"===e.target.tagName&&t(e)})}function t(e){if(e.stopPropagation(),!document.body.classList.contains("zoom-overlay-open")){if(e.metaKey||e.ctrlKey)return o();i({forceDispose:!0}),m=n(e.target),m.zoomImage(),r()}}function o(){window.open(event.target.getAttribute("data-original")||event.target.currentSrc||event.target.src,"_blank")}function i(e){e=e||{forceDispose:!1},m&&(m[e.forceDispose?"dispose":"close"](),s(),m=null)}function r(){window.addEventListener("scroll",a),document.addEventListener("click",l),document.addEventListener("keyup",d),document.addEventListener("touchstart",c),document.addEventListener("touchend",l)}function s(){window.removeEventListener("scroll",a),document.removeEventListener("keyup",d),document.removeEventListener("click",l),document.removeEventListener("touchstart",c),document.removeEventListener("touchend",l)}function a(e){null===f&&(f=window.pageYOffset);var t=f-window.pageYOffset;Math.abs(t)>=40&&i()}function d(e){27==e.keyCode&&i()}function l(e){e.stopPropagation(),e.preventDefault(),i()}function c(e){v=e.touches[0].pageY,e.target.addEventListener("touchmove",u)}function u(e){Math.abs(e.touches[0].pageY-v)<=10||(i(),e.target.removeEventListener("touchmove",u))}var m=null,f=null,v=null;return{listen:e}})().listen()}();

/*! howler.js v2.2.4 | (c) 2013-2020, James Simpson of GoldFire Studios | MIT License | howlerjs.com */
!function(){"use strict";var e=function(){this.init()};e.prototype={init:function(){var e=this||n;return e._counter=1e3,e._html5AudioPool=[],e.html5PoolSize=10,e._codecs={},e._howls=[],e._muted=!1,e._volume=1,e._canPlayEvent="canplaythrough",e._navigator="undefined"!=typeof window&&window.navigator?window.navigator:null,e.masterGain=null,e.noAudio=!1,e.usingWebAudio=!0,e.autoSuspend=!0,e.ctx=null,e.autoUnlock=!0,e._setup(),e},volume:function(e){var o=this||n;if(e=parseFloat(e),o.ctx||_(),void 0!==e&&e>=0&&e<=1){if(o._volume=e,o._muted)return o;o.usingWebAudio&&o.masterGain.gain.setValueAtTime(e,n.ctx.currentTime);for(var t=0;t<o._howls.length;t++)if(!o._howls[t]._webAudio)for(var r=o._howls[t]._getSoundIds(),a=0;a<r.length;a++){var u=o._howls[t]._soundById(r[a]);u&&u._node&&(u._node.volume=u._volume*e)}return o}return o._volume},mute:function(e){var o=this||n;o.ctx||_(),o._muted=e,o.usingWebAudio&&o.masterGain.gain.setValueAtTime(e?0:o._volume,n.ctx.currentTime);for(var t=0;t<o._howls.length;t++)if(!o._howls[t]._webAudio)for(var r=o._howls[t]._getSoundIds(),a=0;a<r.length;a++){var u=o._howls[t]._soundById(r[a]);u&&u._node&&(u._node.muted=!!e||u._muted)}return o},stop:function(){for(var e=this||n,o=0;o<e._howls.length;o++)e._howls[o].stop();return e},unload:function(){for(var e=this||n,o=e._howls.length-1;o>=0;o--)e._howls[o].unload();return e.usingWebAudio&&e.ctx&&void 0!==e.ctx.close&&(e.ctx.close(),e.ctx=null,_()),e},codecs:function(e){return(this||n)._codecs[e.replace(/^x-/,"")]},_setup:function(){var e=this||n;if(e.state=e.ctx?e.ctx.state||"suspended":"suspended",e._autoSuspend(),!e.usingWebAudio)if("undefined"!=typeof Audio)try{var o=new Audio;void 0===o.oncanplaythrough&&(e._canPlayEvent="canplay")}catch(n){e.noAudio=!0}else e.noAudio=!0;try{var o=new Audio;o.muted&&(e.noAudio=!0)}catch(e){}return e.noAudio||e._setupCodecs(),e},_setupCodecs:function(){var e=this||n,o=null;try{o="undefined"!=typeof Audio?new Audio:null}catch(n){return e}if(!o||"function"!=typeof o.canPlayType)return e;var t=o.canPlayType("audio/mpeg;").replace(/^no$/,""),r=e._navigator?e._navigator.userAgent:"",a=r.match(/OPR\/(\d+)/g),u=a&&parseInt(a[0].split("/")[1],10)<33,d=-1!==r.indexOf("Safari")&&-1===r.indexOf("Chrome"),i=r.match(/Version\/(.*?) /),_=d&&i&&parseInt(i[1],10)<15;return e._codecs={mp3:!(u||!t&&!o.canPlayType("audio/mp3;").replace(/^no$/,"")),mpeg:!!t,opus:!!o.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),ogg:!!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),oga:!!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),wav:!!(o.canPlayType('audio/wav; codecs="1"')||o.canPlayType("audio/wav")).replace(/^no$/,""),aac:!!o.canPlayType("audio/aac;").replace(/^no$/,""),caf:!!o.canPlayType("audio/x-caf;").replace(/^no$/,""),m4a:!!(o.canPlayType("audio/x-m4a;")||o.canPlayType("audio/m4a;")||o.canPlayType("audio/aac;")).replace(/^no$/,""),m4b:!!(o.canPlayType("audio/x-m4b;")||o.canPlayType("audio/m4b;")||o.canPlayType("audio/aac;")).replace(/^no$/,""),mp4:!!(o.canPlayType("audio/x-mp4;")||o.canPlayType("audio/mp4;")||o.canPlayType("audio/aac;")).replace(/^no$/,""),weba:!(_||!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),webm:!(_||!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),dolby:!!o.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/,""),flac:!!(o.canPlayType("audio/x-flac;")||o.canPlayType("audio/flac;")).replace(/^no$/,"")},e},_unlockAudio:function(){var e=this||n;if(!e._audioUnlocked&&e.ctx){e._audioUnlocked=!1,e.autoUnlock=!1,e._mobileUnloaded||44100===e.ctx.sampleRate||(e._mobileUnloaded=!0,e.unload()),e._scratchBuffer=e.ctx.createBuffer(1,1,22050);var o=function(n){for(;e._html5AudioPool.length<e.html5PoolSize;)try{var t=new Audio;t._unlocked=!0,e._releaseHtml5Audio(t)}catch(n){e.noAudio=!0;break}for(var r=0;r<e._howls.length;r++)if(!e._howls[r]._webAudio)for(var a=e._howls[r]._getSoundIds(),u=0;u<a.length;u++){var d=e._howls[r]._soundById(a[u]);d&&d._node&&!d._node._unlocked&&(d._node._unlocked=!0,d._node.load())}e._autoResume();var i=e.ctx.createBufferSource();i.buffer=e._scratchBuffer,i.connect(e.ctx.destination),void 0===i.start?i.noteOn(0):i.start(0),"function"==typeof e.ctx.resume&&e.ctx.resume(),i.onended=function(){i.disconnect(0),e._audioUnlocked=!0,document.removeEventListener("touchstart",o,!0),document.removeEventListener("touchend",o,!0),document.removeEventListener("click",o,!0),document.removeEventListener("keydown",o,!0);for(var n=0;n<e._howls.length;n++)e._howls[n]._emit("unlock")}};return document.addEventListener("touchstart",o,!0),document.addEventListener("touchend",o,!0),document.addEventListener("click",o,!0),document.addEventListener("keydown",o,!0),e}},_obtainHtml5Audio:function(){var e=this||n;if(e._html5AudioPool.length)return e._html5AudioPool.pop();var o=(new Audio).play();return o&&"undefined"!=typeof Promise&&(o instanceof Promise||"function"==typeof o.then)&&o.catch(function(){console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.")}),new Audio},_releaseHtml5Audio:function(e){var o=this||n;return e._unlocked&&o._html5AudioPool.push(e),o},_autoSuspend:function(){var e=this;if(e.autoSuspend&&e.ctx&&void 0!==e.ctx.suspend&&n.usingWebAudio){for(var o=0;o<e._howls.length;o++)if(e._howls[o]._webAudio)for(var t=0;t<e._howls[o]._sounds.length;t++)if(!e._howls[o]._sounds[t]._paused)return e;return e._suspendTimer&&clearTimeout(e._suspendTimer),e._suspendTimer=setTimeout(function(){if(e.autoSuspend){e._suspendTimer=null,e.state="suspending";var n=function(){e.state="suspended",e._resumeAfterSuspend&&(delete e._resumeAfterSuspend,e._autoResume())};e.ctx.suspend().then(n,n)}},3e4),e}},_autoResume:function(){var e=this;if(e.ctx&&void 0!==e.ctx.resume&&n.usingWebAudio)return"running"===e.state&&"interrupted"!==e.ctx.state&&e._suspendTimer?(clearTimeout(e._suspendTimer),e._suspendTimer=null):"suspended"===e.state||"running"===e.state&&"interrupted"===e.ctx.state?(e.ctx.resume().then(function(){e.state="running";for(var n=0;n<e._howls.length;n++)e._howls[n]._emit("resume")}),e._suspendTimer&&(clearTimeout(e._suspendTimer),e._suspendTimer=null)):"suspending"===e.state&&(e._resumeAfterSuspend=!0),e}};var n=new e,o=function(e){var n=this;if(!e.src||0===e.src.length)return void console.error("An array of source files must be passed with any new Howl.");n.init(e)};o.prototype={init:function(e){var o=this;return n.ctx||_(),o._autoplay=e.autoplay||!1,o._format="string"!=typeof e.format?e.format:[e.format],o._html5=e.html5||!1,o._muted=e.mute||!1,o._loop=e.loop||!1,o._pool=e.pool||5,o._preload="boolean"!=typeof e.preload&&"metadata"!==e.preload||e.preload,o._rate=e.rate||1,o._sprite=e.sprite||{},o._src="string"!=typeof e.src?e.src:[e.src],o._volume=void 0!==e.volume?e.volume:1,o._xhr={method:e.xhr&&e.xhr.method?e.xhr.method:"GET",headers:e.xhr&&e.xhr.headers?e.xhr.headers:null,withCredentials:!(!e.xhr||!e.xhr.withCredentials)&&e.xhr.withCredentials},o._duration=0,o._state="unloaded",o._sounds=[],o._endTimers={},o._queue=[],o._playLock=!1,o._onend=e.onend?[{fn:e.onend}]:[],o._onfade=e.onfade?[{fn:e.onfade}]:[],o._onload=e.onload?[{fn:e.onload}]:[],o._onloaderror=e.onloaderror?[{fn:e.onloaderror}]:[],o._onplayerror=e.onplayerror?[{fn:e.onplayerror}]:[],o._onpause=e.onpause?[{fn:e.onpause}]:[],o._onplay=e.onplay?[{fn:e.onplay}]:[],o._onstop=e.onstop?[{fn:e.onstop}]:[],o._onmute=e.onmute?[{fn:e.onmute}]:[],o._onvolume=e.onvolume?[{fn:e.onvolume}]:[],o._onrate=e.onrate?[{fn:e.onrate}]:[],o._onseek=e.onseek?[{fn:e.onseek}]:[],o._onunlock=e.onunlock?[{fn:e.onunlock}]:[],o._onresume=[],o._webAudio=n.usingWebAudio&&!o._html5,void 0!==n.ctx&&n.ctx&&n.autoUnlock&&n._unlockAudio(),n._howls.push(o),o._autoplay&&o._queue.push({event:"play",action:function(){o.play()}}),o._preload&&"none"!==o._preload&&o.load(),o},load:function(){var e=this,o=null;if(n.noAudio)return void e._emit("loaderror",null,"No audio support.");"string"==typeof e._src&&(e._src=[e._src]);for(var r=0;r<e._src.length;r++){var u,d;if(e._format&&e._format[r])u=e._format[r];else{if("string"!=typeof(d=e._src[r])){e._emit("loaderror",null,"Non-string found in selected audio sources - ignoring.");continue}u=/^data:audio\/([^;,]+);/i.exec(d),u||(u=/\.([^.]+)$/.exec(d.split("?",1)[0])),u&&(u=u[1].toLowerCase())}if(u||console.warn('No file extension was found. Consider using the "format" property or specify an extension.'),u&&n.codecs(u)){o=e._src[r];break}}return o?(e._src=o,e._state="loading","https:"===window.location.protocol&&"http:"===o.slice(0,5)&&(e._html5=!0,e._webAudio=!1),new t(e),e._webAudio&&a(e),e):void e._emit("loaderror",null,"No codec support for selected audio sources.")},play:function(e,o){var t=this,r=null;if("number"==typeof e)r=e,e=null;else{if("string"==typeof e&&"loaded"===t._state&&!t._sprite[e])return null;if(void 0===e&&(e="__default",!t._playLock)){for(var a=0,u=0;u<t._sounds.length;u++)t._sounds[u]._paused&&!t._sounds[u]._ended&&(a++,r=t._sounds[u]._id);1===a?e=null:r=null}}var d=r?t._soundById(r):t._inactiveSound();if(!d)return null;if(r&&!e&&(e=d._sprite||"__default"),"loaded"!==t._state){d._sprite=e,d._ended=!1;var i=d._id;return t._queue.push({event:"play",action:function(){t.play(i)}}),i}if(r&&!d._paused)return o||t._loadQueue("play"),d._id;t._webAudio&&n._autoResume();var _=Math.max(0,d._seek>0?d._seek:t._sprite[e][0]/1e3),s=Math.max(0,(t._sprite[e][0]+t._sprite[e][1])/1e3-_),l=1e3*s/Math.abs(d._rate),c=t._sprite[e][0]/1e3,f=(t._sprite[e][0]+t._sprite[e][1])/1e3;d._sprite=e,d._ended=!1;var p=function(){d._paused=!1,d._seek=_,d._start=c,d._stop=f,d._loop=!(!d._loop&&!t._sprite[e][2])};if(_>=f)return void t._ended(d);var m=d._node;if(t._webAudio){var v=function(){t._playLock=!1,p(),t._refreshBuffer(d);var e=d._muted||t._muted?0:d._volume;m.gain.setValueAtTime(e,n.ctx.currentTime),d._playStart=n.ctx.currentTime,void 0===m.bufferSource.start?d._loop?m.bufferSource.noteGrainOn(0,_,86400):m.bufferSource.noteGrainOn(0,_,s):d._loop?m.bufferSource.start(0,_,86400):m.bufferSource.start(0,_,s),l!==1/0&&(t._endTimers[d._id]=setTimeout(t._ended.bind(t,d),l)),o||setTimeout(function(){t._emit("play",d._id),t._loadQueue()},0)};"running"===n.state&&"interrupted"!==n.ctx.state?v():(t._playLock=!0,t.once("resume",v),t._clearTimer(d._id))}else{var h=function(){m.currentTime=_,m.muted=d._muted||t._muted||n._muted||m.muted,m.volume=d._volume*n.volume(),m.playbackRate=d._rate;try{var r=m.play();if(r&&"undefined"!=typeof Promise&&(r instanceof Promise||"function"==typeof r.then)?(t._playLock=!0,p(),r.then(function(){t._playLock=!1,m._unlocked=!0,o?t._loadQueue():t._emit("play",d._id)}).catch(function(){t._playLock=!1,t._emit("playerror",d._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."),d._ended=!0,d._paused=!0})):o||(t._playLock=!1,p(),t._emit("play",d._id)),m.playbackRate=d._rate,m.paused)return void t._emit("playerror",d._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");"__default"!==e||d._loop?t._endTimers[d._id]=setTimeout(t._ended.bind(t,d),l):(t._endTimers[d._id]=function(){t._ended(d),m.removeEventListener("ended",t._endTimers[d._id],!1)},m.addEventListener("ended",t._endTimers[d._id],!1))}catch(e){t._emit("playerror",d._id,e)}};"data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"===m.src&&(m.src=t._src,m.load());var y=window&&window.ejecta||!m.readyState&&n._navigator.isCocoonJS;if(m.readyState>=3||y)h();else{t._playLock=!0,t._state="loading";var g=function(){t._state="loaded",h(),m.removeEventListener(n._canPlayEvent,g,!1)};m.addEventListener(n._canPlayEvent,g,!1),t._clearTimer(d._id)}}return d._id},pause:function(e){var n=this;if("loaded"!==n._state||n._playLock)return n._queue.push({event:"pause",action:function(){n.pause(e)}}),n;for(var o=n._getSoundIds(e),t=0;t<o.length;t++){n._clearTimer(o[t]);var r=n._soundById(o[t]);if(r&&!r._paused&&(r._seek=n.seek(o[t]),r._rateSeek=0,r._paused=!0,n._stopFade(o[t]),r._node))if(n._webAudio){if(!r._node.bufferSource)continue;void 0===r._node.bufferSource.stop?r._node.bufferSource.noteOff(0):r._node.bufferSource.stop(0),n._cleanBuffer(r._node)}else isNaN(r._node.duration)&&r._node.duration!==1/0||r._node.pause();arguments[1]||n._emit("pause",r?r._id:null)}return n},stop:function(e,n){var o=this;if("loaded"!==o._state||o._playLock)return o._queue.push({event:"stop",action:function(){o.stop(e)}}),o;for(var t=o._getSoundIds(e),r=0;r<t.length;r++){o._clearTimer(t[r]);var a=o._soundById(t[r]);a&&(a._seek=a._start||0,a._rateSeek=0,a._paused=!0,a._ended=!0,o._stopFade(t[r]),a._node&&(o._webAudio?a._node.bufferSource&&(void 0===a._node.bufferSource.stop?a._node.bufferSource.noteOff(0):a._node.bufferSource.stop(0),o._cleanBuffer(a._node)):isNaN(a._node.duration)&&a._node.duration!==1/0||(a._node.currentTime=a._start||0,a._node.pause(),a._node.duration===1/0&&o._clearSound(a._node))),n||o._emit("stop",a._id))}return o},mute:function(e,o){var t=this;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"mute",action:function(){t.mute(e,o)}}),t;if(void 0===o){if("boolean"!=typeof e)return t._muted;t._muted=e}for(var r=t._getSoundIds(o),a=0;a<r.length;a++){var u=t._soundById(r[a]);u&&(u._muted=e,u._interval&&t._stopFade(u._id),t._webAudio&&u._node?u._node.gain.setValueAtTime(e?0:u._volume,n.ctx.currentTime):u._node&&(u._node.muted=!!n._muted||e),t._emit("mute",u._id))}return t},volume:function(){var e,o,t=this,r=arguments;if(0===r.length)return t._volume;if(1===r.length||2===r.length&&void 0===r[1]){t._getSoundIds().indexOf(r[0])>=0?o=parseInt(r[0],10):e=parseFloat(r[0])}else r.length>=2&&(e=parseFloat(r[0]),o=parseInt(r[1],10));var a;if(!(void 0!==e&&e>=0&&e<=1))return a=o?t._soundById(o):t._sounds[0],a?a._volume:0;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"volume",action:function(){t.volume.apply(t,r)}}),t;void 0===o&&(t._volume=e),o=t._getSoundIds(o);for(var u=0;u<o.length;u++)(a=t._soundById(o[u]))&&(a._volume=e,r[2]||t._stopFade(o[u]),t._webAudio&&a._node&&!a._muted?a._node.gain.setValueAtTime(e,n.ctx.currentTime):a._node&&!a._muted&&(a._node.volume=e*n.volume()),t._emit("volume",a._id));return t},fade:function(e,o,t,r){var a=this;if("loaded"!==a._state||a._playLock)return a._queue.push({event:"fade",action:function(){a.fade(e,o,t,r)}}),a;e=Math.min(Math.max(0,parseFloat(e)),1),o=Math.min(Math.max(0,parseFloat(o)),1),t=parseFloat(t),a.volume(e,r);for(var u=a._getSoundIds(r),d=0;d<u.length;d++){var i=a._soundById(u[d]);if(i){if(r||a._stopFade(u[d]),a._webAudio&&!i._muted){var _=n.ctx.currentTime,s=_+t/1e3;i._volume=e,i._node.gain.setValueAtTime(e,_),i._node.gain.linearRampToValueAtTime(o,s)}a._startFadeInterval(i,e,o,t,u[d],void 0===r)}}return a},_startFadeInterval:function(e,n,o,t,r,a){var u=this,d=n,i=o-n,_=Math.abs(i/.01),s=Math.max(4,_>0?t/_:t),l=Date.now();e._fadeTo=o,e._interval=setInterval(function(){var r=(Date.now()-l)/t;l=Date.now(),d+=i*r,d=Math.round(100*d)/100,d=i<0?Math.max(o,d):Math.min(o,d),u._webAudio?e._volume=d:u.volume(d,e._id,!0),a&&(u._volume=d),(o<n&&d<=o||o>n&&d>=o)&&(clearInterval(e._interval),e._interval=null,e._fadeTo=null,u.volume(o,e._id),u._emit("fade",e._id))},s)},_stopFade:function(e){var o=this,t=o._soundById(e);return t&&t._interval&&(o._webAudio&&t._node.gain.cancelScheduledValues(n.ctx.currentTime),clearInterval(t._interval),t._interval=null,o.volume(t._fadeTo,e),t._fadeTo=null,o._emit("fade",e)),o},loop:function(){var e,n,o,t=this,r=arguments;if(0===r.length)return t._loop;if(1===r.length){if("boolean"!=typeof r[0])return!!(o=t._soundById(parseInt(r[0],10)))&&o._loop;e=r[0],t._loop=e}else 2===r.length&&(e=r[0],n=parseInt(r[1],10));for(var a=t._getSoundIds(n),u=0;u<a.length;u++)(o=t._soundById(a[u]))&&(o._loop=e,t._webAudio&&o._node&&o._node.bufferSource&&(o._node.bufferSource.loop=e,e&&(o._node.bufferSource.loopStart=o._start||0,o._node.bufferSource.loopEnd=o._stop,t.playing(a[u])&&(t.pause(a[u],!0),t.play(a[u],!0)))));return t},rate:function(){var e,o,t=this,r=arguments;if(0===r.length)o=t._sounds[0]._id;else if(1===r.length){var a=t._getSoundIds(),u=a.indexOf(r[0]);u>=0?o=parseInt(r[0],10):e=parseFloat(r[0])}else 2===r.length&&(e=parseFloat(r[0]),o=parseInt(r[1],10));var d;if("number"!=typeof e)return d=t._soundById(o),d?d._rate:t._rate;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"rate",action:function(){t.rate.apply(t,r)}}),t;void 0===o&&(t._rate=e),o=t._getSoundIds(o);for(var i=0;i<o.length;i++)if(d=t._soundById(o[i])){t.playing(o[i])&&(d._rateSeek=t.seek(o[i]),d._playStart=t._webAudio?n.ctx.currentTime:d._playStart),d._rate=e,t._webAudio&&d._node&&d._node.bufferSource?d._node.bufferSource.playbackRate.setValueAtTime(e,n.ctx.currentTime):d._node&&(d._node.playbackRate=e);var _=t.seek(o[i]),s=(t._sprite[d._sprite][0]+t._sprite[d._sprite][1])/1e3-_,l=1e3*s/Math.abs(d._rate);!t._endTimers[o[i]]&&d._paused||(t._clearTimer(o[i]),t._endTimers[o[i]]=setTimeout(t._ended.bind(t,d),l)),t._emit("rate",d._id)}return t},seek:function(){var e,o,t=this,r=arguments;if(0===r.length)t._sounds.length&&(o=t._sounds[0]._id);else if(1===r.length){var a=t._getSoundIds(),u=a.indexOf(r[0]);u>=0?o=parseInt(r[0],10):t._sounds.length&&(o=t._sounds[0]._id,e=parseFloat(r[0]))}else 2===r.length&&(e=parseFloat(r[0]),o=parseInt(r[1],10));if(void 0===o)return 0;if("number"==typeof e&&("loaded"!==t._state||t._playLock))return t._queue.push({event:"seek",action:function(){t.seek.apply(t,r)}}),t;var d=t._soundById(o);if(d){if(!("number"==typeof e&&e>=0)){if(t._webAudio){var i=t.playing(o)?n.ctx.currentTime-d._playStart:0,_=d._rateSeek?d._rateSeek-d._seek:0;return d._seek+(_+i*Math.abs(d._rate))}return d._node.currentTime}var s=t.playing(o);s&&t.pause(o,!0),d._seek=e,d._ended=!1,t._clearTimer(o),t._webAudio||!d._node||isNaN(d._node.duration)||(d._node.currentTime=e);var l=function(){s&&t.play(o,!0),t._emit("seek",o)};if(s&&!t._webAudio){var c=function(){t._playLock?setTimeout(c,0):l()};setTimeout(c,0)}else l()}return t},playing:function(e){var n=this;if("number"==typeof e){var o=n._soundById(e);return!!o&&!o._paused}for(var t=0;t<n._sounds.length;t++)if(!n._sounds[t]._paused)return!0;return!1},duration:function(e){var n=this,o=n._duration,t=n._soundById(e);return t&&(o=n._sprite[t._sprite][1]/1e3),o},state:function(){return this._state},unload:function(){for(var e=this,o=e._sounds,t=0;t<o.length;t++)o[t]._paused||e.stop(o[t]._id),e._webAudio||(e._clearSound(o[t]._node),o[t]._node.removeEventListener("error",o[t]._errorFn,!1),o[t]._node.removeEventListener(n._canPlayEvent,o[t]._loadFn,!1),o[t]._node.removeEventListener("ended",o[t]._endFn,!1),n._releaseHtml5Audio(o[t]._node)),delete o[t]._node,e._clearTimer(o[t]._id);var a=n._howls.indexOf(e);a>=0&&n._howls.splice(a,1);var u=!0;for(t=0;t<n._howls.length;t++)if(n._howls[t]._src===e._src||e._src.indexOf(n._howls[t]._src)>=0){u=!1;break}return r&&u&&delete r[e._src],n.noAudio=!1,e._state="unloaded",e._sounds=[],e=null,null},on:function(e,n,o,t){var r=this,a=r["_on"+e];return"function"==typeof n&&a.push(t?{id:o,fn:n,once:t}:{id:o,fn:n}),r},off:function(e,n,o){var t=this,r=t["_on"+e],a=0;if("number"==typeof n&&(o=n,n=null),n||o)for(a=0;a<r.length;a++){var u=o===r[a].id;if(n===r[a].fn&&u||!n&&u){r.splice(a,1);break}}else if(e)t["_on"+e]=[];else{var d=Object.keys(t);for(a=0;a<d.length;a++)0===d[a].indexOf("_on")&&Array.isArray(t[d[a]])&&(t[d[a]]=[])}return t},once:function(e,n,o){var t=this;return t.on(e,n,o,1),t},_emit:function(e,n,o){for(var t=this,r=t["_on"+e],a=r.length-1;a>=0;a--)r[a].id&&r[a].id!==n&&"load"!==e||(setTimeout(function(e){e.call(this,n,o)}.bind(t,r[a].fn),0),r[a].once&&t.off(e,r[a].fn,r[a].id));return t._loadQueue(e),t},_loadQueue:function(e){var n=this;if(n._queue.length>0){var o=n._queue[0];o.event===e&&(n._queue.shift(),n._loadQueue()),e||o.action()}return n},_ended:function(e){var o=this,t=e._sprite;if(!o._webAudio&&e._node&&!e._node.paused&&!e._node.ended&&e._node.currentTime<e._stop)return setTimeout(o._ended.bind(o,e),100),o;var r=!(!e._loop&&!o._sprite[t][2]);if(o._emit("end",e._id),!o._webAudio&&r&&o.stop(e._id,!0).play(e._id),o._webAudio&&r){o._emit("play",e._id),e._seek=e._start||0,e._rateSeek=0,e._playStart=n.ctx.currentTime;var a=1e3*(e._stop-e._start)/Math.abs(e._rate);o._endTimers[e._id]=setTimeout(o._ended.bind(o,e),a)}return o._webAudio&&!r&&(e._paused=!0,e._ended=!0,e._seek=e._start||0,e._rateSeek=0,o._clearTimer(e._id),o._cleanBuffer(e._node),n._autoSuspend()),o._webAudio||r||o.stop(e._id,!0),o},_clearTimer:function(e){var n=this;if(n._endTimers[e]){if("function"!=typeof n._endTimers[e])clearTimeout(n._endTimers[e]);else{var o=n._soundById(e);o&&o._node&&o._node.removeEventListener("ended",n._endTimers[e],!1)}delete n._endTimers[e]}return n},_soundById:function(e){for(var n=this,o=0;o<n._sounds.length;o++)if(e===n._sounds[o]._id)return n._sounds[o];return null},_inactiveSound:function(){var e=this;e._drain();for(var n=0;n<e._sounds.length;n++)if(e._sounds[n]._ended)return e._sounds[n].reset();return new t(e)},_drain:function(){var e=this,n=e._pool,o=0,t=0;if(!(e._sounds.length<n)){for(t=0;t<e._sounds.length;t++)e._sounds[t]._ended&&o++;for(t=e._sounds.length-1;t>=0;t--){if(o<=n)return;e._sounds[t]._ended&&(e._webAudio&&e._sounds[t]._node&&e._sounds[t]._node.disconnect(0),e._sounds.splice(t,1),o--)}}},_getSoundIds:function(e){var n=this;if(void 0===e){for(var o=[],t=0;t<n._sounds.length;t++)o.push(n._sounds[t]._id);return o}return[e]},_refreshBuffer:function(e){var o=this;return e._node.bufferSource=n.ctx.createBufferSource(),e._node.bufferSource.buffer=r[o._src],e._panner?e._node.bufferSource.connect(e._panner):e._node.bufferSource.connect(e._node),e._node.bufferSource.loop=e._loop,e._loop&&(e._node.bufferSource.loopStart=e._start||0,e._node.bufferSource.loopEnd=e._stop||0),e._node.bufferSource.playbackRate.setValueAtTime(e._rate,n.ctx.currentTime),o},_cleanBuffer:function(e){var o=this,t=n._navigator&&n._navigator.vendor.indexOf("Apple")>=0;if(!e.bufferSource)return o;if(n._scratchBuffer&&e.bufferSource&&(e.bufferSource.onended=null,e.bufferSource.disconnect(0),t))try{e.bufferSource.buffer=n._scratchBuffer}catch(e){}return e.bufferSource=null,o},_clearSound:function(e){/MSIE |Trident\//.test(n._navigator&&n._navigator.userAgent)||(e.src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")}};var t=function(e){this._parent=e,this.init()};t.prototype={init:function(){var e=this,o=e._parent;return e._muted=o._muted,e._loop=o._loop,e._volume=o._volume,e._rate=o._rate,e._seek=0,e._paused=!0,e._ended=!0,e._sprite="__default",e._id=++n._counter,o._sounds.push(e),e.create(),e},create:function(){var e=this,o=e._parent,t=n._muted||e._muted||e._parent._muted?0:e._volume;return o._webAudio?(e._node=void 0===n.ctx.createGain?n.ctx.createGainNode():n.ctx.createGain(),e._node.gain.setValueAtTime(t,n.ctx.currentTime),e._node.paused=!0,e._node.connect(n.masterGain)):n.noAudio||(e._node=n._obtainHtml5Audio(),e._errorFn=e._errorListener.bind(e),e._node.addEventListener("error",e._errorFn,!1),e._loadFn=e._loadListener.bind(e),e._node.addEventListener(n._canPlayEvent,e._loadFn,!1),e._endFn=e._endListener.bind(e),e._node.addEventListener("ended",e._endFn,!1),e._node.src=o._src,e._node.preload=!0===o._preload?"auto":o._preload,e._node.volume=t*n.volume(),e._node.load()),e},reset:function(){var e=this,o=e._parent;return e._muted=o._muted,e._loop=o._loop,e._volume=o._volume,e._rate=o._rate,e._seek=0,e._rateSeek=0,e._paused=!0,e._ended=!0,e._sprite="__default",e._id=++n._counter,e},_errorListener:function(){var e=this;e._parent._emit("loaderror",e._id,e._node.error?e._node.error.code:0),e._node.removeEventListener("error",e._errorFn,!1)},_loadListener:function(){var e=this,o=e._parent;o._duration=Math.ceil(10*e._node.duration)/10,0===Object.keys(o._sprite).length&&(o._sprite={__default:[0,1e3*o._duration]}),"loaded"!==o._state&&(o._state="loaded",o._emit("load"),o._loadQueue()),e._node.removeEventListener(n._canPlayEvent,e._loadFn,!1)},_endListener:function(){var e=this,n=e._parent;n._duration===1/0&&(n._duration=Math.ceil(10*e._node.duration)/10,n._sprite.__default[1]===1/0&&(n._sprite.__default[1]=1e3*n._duration),n._ended(e)),e._node.removeEventListener("ended",e._endFn,!1)}};var r={},a=function(e){var n=e._src;if(r[n])return e._duration=r[n].duration,void i(e);if(/^data:[^;]+;base64,/.test(n)){for(var o=atob(n.split(",")[1]),t=new Uint8Array(o.length),a=0;a<o.length;++a)t[a]=o.charCodeAt(a);d(t.buffer,e)}else{var _=new XMLHttpRequest;_.open(e._xhr.method,n,!0),_.withCredentials=e._xhr.withCredentials,_.responseType="arraybuffer",e._xhr.headers&&Object.keys(e._xhr.headers).forEach(function(n){_.setRequestHeader(n,e._xhr.headers[n])}),_.onload=function(){var n=(_.status+"")[0];if("0"!==n&&"2"!==n&&"3"!==n)return void e._emit("loaderror",null,"Failed loading audio file with status: "+_.status+".");d(_.response,e)},_.onerror=function(){e._webAudio&&(e._html5=!0,e._webAudio=!1,e._sounds=[],delete r[n],e.load())},u(_)}},u=function(e){try{e.send()}catch(n){e.onerror()}},d=function(e,o){var t=function(){o._emit("loaderror",null,"Decoding audio data failed.")},a=function(e){e&&o._sounds.length>0?(r[o._src]=e,i(o,e)):t()};"undefined"!=typeof Promise&&1===n.ctx.decodeAudioData.length?n.ctx.decodeAudioData(e).then(a).catch(t):n.ctx.decodeAudioData(e,a,t)},i=function(e,n){n&&!e._duration&&(e._duration=n.duration),0===Object.keys(e._sprite).length&&(e._sprite={__default:[0,1e3*e._duration]}),"loaded"!==e._state&&(e._state="loaded",e._emit("load"),e._loadQueue())},_=function(){if(n.usingWebAudio){try{"undefined"!=typeof AudioContext?n.ctx=new AudioContext:"undefined"!=typeof webkitAudioContext?n.ctx=new webkitAudioContext:n.usingWebAudio=!1}catch(e){n.usingWebAudio=!1}n.ctx||(n.usingWebAudio=!1);var e=/iP(hone|od|ad)/.test(n._navigator&&n._navigator.platform),o=n._navigator&&n._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),t=o?parseInt(o[1],10):null;if(e&&t&&t<9){var r=/safari/.test(n._navigator&&n._navigator.userAgent.toLowerCase());n._navigator&&!r&&(n.usingWebAudio=!1)}n.usingWebAudio&&(n.masterGain=void 0===n.ctx.createGain?n.ctx.createGainNode():n.ctx.createGain(),n.masterGain.gain.setValueAtTime(n._muted?0:n._volume,n.ctx.currentTime),n.masterGain.connect(n.ctx.destination)),n._setup()}};"function"==typeof define&&define.amd&&define([],function(){return{Howler:n,Howl:o}}),"undefined"!=typeof exports&&(exports.Howler=n,exports.Howl=o),"undefined"!=typeof global?(global.HowlerGlobal=e,global.Howler=n,global.Howl=o,global.Sound=t):"undefined"!=typeof window&&(window.HowlerGlobal=e,window.Howler=n,window.Howl=o,window.Sound=t)}();

// A lightweight youtube embed v0.3.3 : https://github.com/paulirish/lite-youtube-embed
class LiteYTEmbed extends HTMLElement{connectedCallback(){this.videoId=this.getAttribute("videoid");let e=this.querySelector(".lty-playbtn");if(this.playLabel=e&&e.textContent.trim()||this.getAttribute("playlabel")||"Play",this.dataset.title=this.getAttribute("title")||"",this.style.backgroundImage||(this.style.backgroundImage=`url("https://i.ytimg.com/vi/${this.videoId}/hqdefault.jpg")`,this.upgradePosterImage()),e||((e=document.createElement("button")).type="button",e.classList.add("lty-playbtn"),this.append(e)),!e.textContent){let t=document.createElement("span");t.className="lyt-visually-hidden",t.textContent=this.playLabel,e.append(t)}this.addNoscriptIframe(),"A"===e.nodeName&&(e.removeAttribute("href"),e.setAttribute("tabindex","0"),e.setAttribute("role","button"),e.addEventListener("keydown",e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),this.activate())})),this.addEventListener("pointerover",LiteYTEmbed.warmConnections,{once:!0}),this.addEventListener("focusin",LiteYTEmbed.warmConnections,{once:!0}),this.addEventListener("click",this.activate),this.needsYTApi=this.hasAttribute("js-api")||navigator.vendor.includes("Apple")||navigator.userAgent.includes("Mobi")}static addPrefetch(e,t,i){let a=document.createElement("link");a.rel=e,a.href=t,i&&(a.as=i),document.head.append(a)}static warmConnections(){LiteYTEmbed.preconnected||(LiteYTEmbed.addPrefetch("preconnect","https://www.youtube-nocookie.com"),LiteYTEmbed.addPrefetch("preconnect","https://www.google.com"),LiteYTEmbed.addPrefetch("preconnect","https://googleads.g.doubleclick.net"),LiteYTEmbed.addPrefetch("preconnect","https://static.doubleclick.net"),LiteYTEmbed.preconnected=!0)}fetchYTPlayerApi(){window.YT||window.YT&&window.YT.Player||(this.ytApiPromise=new Promise((e,t)=>{var i=document.createElement("script");i.src="https://www.youtube.com/iframe_api",i.async=!0,i.onload=t=>{YT.ready(e)},i.onerror=t,this.append(i)}))}async getYTPlayer(){return this.playerPromise||await this.activate(),this.playerPromise}async addYTPlayerIframe(){this.fetchYTPlayerApi(),await this.ytApiPromise;let e=document.createElement("div");this.append(e);let t=Object.fromEntries(this.getParams().entries());this.playerPromise=new Promise(i=>{let a=new YT.Player(e,{width:"100%",videoId:this.videoId,playerVars:t,events:{onReady(e){e.target.playVideo(),i(a)}}})})}addNoscriptIframe(){let e=this.createBasicIframe(),t=document.createElement("noscript");t.innerHTML=e.outerHTML,this.append(t)}getParams(){let e=new URLSearchParams(this.getAttribute("params")||[]);return e.append("autoplay","1"),e.append("playsinline","1"),e}async activate(){if(this.classList.contains("lyt-activated"))return;if(this.classList.add("lyt-activated"),this.needsYTApi)return this.addYTPlayerIframe(this.getParams());let e=this.createBasicIframe();this.append(e),e.focus()}createBasicIframe(){let e=document.createElement("iframe");return e.width=560,e.height=315,e.title=this.playLabel,e.allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",e.allowFullscreen=!0,e.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId)}?${this.getParams().toString()}`,e}upgradePosterImage(){setTimeout(()=>{let e=`https://i.ytimg.com/vi_webp/${this.videoId}/sddefault.webp`,t=new Image;t.fetchPriority="low",t.referrerpolicy="origin",t.src=e,t.onload=t=>{let i=90==t.target.naturalHeight&&120==t.target.naturalWidth;i||(this.style.backgroundImage=`url("${e}")`)}},100)}}customElements.define("lite-youtube",LiteYTEmbed);

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
          premiereadulte: 'https://calendly.com/luminose/premiere-seance-adulte?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
          premiereenfant: 'https://calendly.com/luminose/premiere-seance-enfant?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
          adulte: 'https://calendly.com/luminose/seance-adulte?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
          enfant: 'https://calendly.com/luminose/seance-enfant?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
          respiration: 'https://calendly.com/luminose/seance-respiration-holotropique?hide_gdpr_banner=1&hide_event_type_details=1&primary_color=6163a5',
        },
        rh: {
          formulaire_paiment: window.location.origin + "/respiration-holotropique/inscription-etape-2.html",
          confirmation_paiment: window.location.origin + "/respiration-holotropique/inscription-etape-3.html",
          make_webhook_get_payment_intent: "https://hook.eu1.make.com/fwj3qqn7fcpnyo7m2anjw21esql2292k", // TEST
          make_webhook_send_coupon_update_payment_intent: "https://hook.eu1.make.com/7twhzl9jnganhgcy5e5xarvquak10y8r", // TEST
          stripe_script: "https://js.stripe.com/v3/",
        },
        futura_font: window.location.origin + "/fonts/5313918/55e6a203-1f50-4971-89d0-17ca0150f29d.woff",
      }
    };

    if (this._config.environment == "production") {
      this._config.keys.rh.stripe_public = "pk_live_P2BYIjcwyPoYiBqB9yHQYwAn00hWHz2vkg";
      this._config.urls.rh.make_webhook_get_payment_intent = "https://hook.eu1.make.com/269wcbq6nktemc3pvuuevkp7rbje1iny";
      this._config.urls.rh.make_webhook_send_coupon_update_payment_intent = "https://hook.eu1.make.com/5bz49mf812gykm8p9khxffr9tho7c5ev";
    }

    // Appel automatique de la méthode `run` après l'initialisation
    this._run();
  },

  _run: function() {
    // console.log(`App running in ${this._config.environment} mode`);
    this.setupViewport();
    this.setupCookiesModal();
    this.setupNavigation();
    this.setupCarouselTemoignages();
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

  setupCarouselTemoignages: function() {
    const carouselContainer = document.querySelector(".temoignages.carousel-container");
    if (carouselContainer === null) return;
    const carousel = carouselContainer.querySelector(".carousel");
    const temoignages = carousel.querySelectorAll(".temoignage");
    const btnLeft = carouselContainer.querySelector(".button.left");
    const btnRight = carouselContainer.querySelector(".button.right");
    
    const temoignagesAffiches = 3; // Nombre de témoignages visibles en même temps
    const totalTemoignages = temoignages.length;
    const maxIndex = Math.ceil(totalTemoignages / temoignagesAffiches) - 1; // Dernier index possible
    const that = this;
    let index = 0;

    

    btnRight.addEventListener("click", function () {
      if (index < maxIndex) {
        index++;
        that._updateCarousel(carousel, btnLeft, btnRight, index, maxIndex);
      }
    });

    btnLeft.addEventListener("click", function () {
      if (index > 0) {
        index--;
        that._updateCarousel(carousel, btnLeft, btnRight, index, maxIndex);
      }
    });

    that._updateCarousel(carousel, btnLeft, btnRight, index, maxIndex);
  },

  _updateCarousel:function(carousel, btnLeft, btnRight, index, maxIndex) {
    const offset = -(index * 100) + "%";
    carousel.style.transform = `translateX(${offset})`;

    // Gérer l'état des boutons
    btnLeft.disabled = index === 0;
    btnRight.disabled = index === maxIndex;
  },

  setupButtonPriseRdv() {
    const modalElement = document.querySelector('#md-prise-rdv');
    if (modalElement) {
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
      optionsPaiements.couponButton = optionsPaiements.querySelector('button#apply-coupon');
      optionsPaiements.couponInput  = optionsPaiements.querySelector('input#coupon');
      optionsPaiements.couponError  = optionsPaiements.querySelector('div#coupon-error');
      optionsPaiements.couponSuccess= optionsPaiements.querySelector('div#coupon-success');
      optionsPaiements.fieldset     = optionsPaiements.querySelector('fieldset');
      optionsPaiements.amountDue    = optionsPaiements.querySelector('#amount-due');      
      
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

      optionsPaiements.couponInput.addEventListener("keydown", function (event) {
        if (event.keyCode === 13) {
          optionsPaiements.couponButton.click();
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
    this._setupStripeCouponButton(clientSecret, stripe, optionsPaiements);
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
        // console.error("Erreur lors de la création du PaymentIntent:", error.message);
        return null;
      }
  
      // console.log("Client secret reçu.");
      return clientSecret;
    } catch (err) {
      // console.error("Erreur lors de la requête au backend:", err);
      return null;
    }
  },
  
  _setupFormSubmission: function (elements, stripe, optionsPaiements, billingDetails, returnUrl) {
    const form = optionsPaiements.stripeForm;
    let submitted = false;
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitted) return;
      if (document.activeElement.id == "coupon") return;

  
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
        // console.error("Erreur lors de la confirmation de paiement:", err.message);
        submitted = false;
        optionsPaiements.fieldset.disabled = false;
      }
    });
  },

  _setupStripeCouponButton: async function (clientSecret, stripe, optionsPaiements) {
    optionsPaiements.couponButton.addEventListener("click", async () => {
      const couponCode = optionsPaiements.couponInput.value;
      if (couponCode != '') {
        optionsPaiements.fieldset.disabled = true;
        optionsPaiements.couponError.innerHTML = "";
        optionsPaiements.couponError.classList.add('is-hidden');
        const montant_journee_rh = this._config.montants.journee_rh;
        const paymentIntentId = clientSecret.split('_secret')[0];

        try {
          const response = await fetch(this._config.urls.rh.make_webhook_send_coupon_update_payment_intent, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntentId, // ID du PaymentIntent
              couponCode: couponCode,
              originalAmount: montant_journee_rh, // Montant initial en centimes
            }),
          });
      
          const { data, error } = await response.json();
          if (error) {
            // PB dans la réponse de Make OU code promo invalide
            // console.error("Erreur lors de la recherche du code promo:", error.message);
            optionsPaiements.couponError.innerHTML = error.message;
            optionsPaiements.couponError.classList.remove('is-hidden');
            optionsPaiements.fieldset.disabled = false;
            return null;
          } else {
            optionsPaiements.couponSuccess.innerHTML = 'Code coupon appliqué : <span class="tag is-white">' + data.couponCode + '</span> <span class="tag is-white">-' + (data.amountOff / 100) + '€</span>';
            optionsPaiements.couponSuccess.classList.remove('is-hidden');
            optionsPaiements.amountDue.innerHTML = '<s>' +  (data.originalAmount / 100) + '€</s> ' + (data.updatedAmount / 100) + '€';
            // console.log(data);
            optionsPaiements.fieldset.disabled = false;
            return true;
          }        
        } catch (err) {
          // PB de connexion avec Make
          // console.error("Erreur lors de la requête au backend:", err);
          message = 'Il semble qu\'il y ait un problème technique. Si vous pensez que votre code est valide, merci de me contacter par e-mail : <a href="mailto:florent@luminose.fr">florent@luminose.fr</a>';
          optionsPaiements.couponError.innerHTML = message;
          optionsPaiements.couponError.classList.remove('is-hidden');
          optionsPaiements.fieldset.disabled = false;
          return null;
        }
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
