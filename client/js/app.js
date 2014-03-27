'use strict';

global.jQuery = require('jquery');
require('bootstrap/dist/js/bootstrap');
require('angular/angular');
require('angular-route/angular-route');
require('angular-cookies/angular-cookies');
require('angular-resource/angular-resource');
// require('angular-ui-bootstrap/ui-bootstrap');
require('angular-ui-router/release/angular-ui-router');
require('ng-upload/ng-upload');
require('ng-grid/build/ng-grid');

angular.module('lbd', [
    'ngCookies',
    'ngResource',
    // 'ui.bootstrap',
    'ui.router',
    'ngUpload',
    'ngGrid'
  ])
  .config(require('./config')())
  .factory('Global', require('./services/global')())
  .controller('IndexController', require('./controllers/index')())
  .controller('HeaderController', require('./controllers/header')())
  .controller('MyController', require('./controllers/my')());

angular.element(document).ready(function() {
  angular.bootstrap(document, ['lbd']);
});
