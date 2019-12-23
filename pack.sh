#!/bin/sh

sass --sourcemap=none css/luminose.scss:css/luminose.css
csso css/luminose.css --output css/luminose.min.css
#uglifyjs modules/wlu/wlu.js --output modules/wlu/wlu.min.js
