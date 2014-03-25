'use strict';

global.jQuery = require('jquery');
require('bootstrap/dist/js/bootstrap');
require('angular/angular');
require('angular-route/angular-route');
require('ng-upload/ng-upload');

angular.module('lbd', ['ngUpload'])
  .controller('MyController', require('./controllers/MyController')());

