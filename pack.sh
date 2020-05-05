#!/bin/sh

sass --sourcemap=none css/luminose.scss:css/luminose.css
csso css/luminose.css --output css/luminose.min.css
#uglifyjs js/luminose.js --output js/luminose.min.js
