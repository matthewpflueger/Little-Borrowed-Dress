'use strict';

global.jQuery = require('jquery');
require('jqueryui/ui/jquery-ui');
require('bootstrap/dist/js/bootstrap');
require('angular/angular');
require('angular-route/angular-route');
require('angular-cookies/angular-cookies');
require('angular-resource/angular-resource');
require('angular-ui-router/release/angular-ui-router');
require('ng-upload/ng-upload');
require('ng-grid/build/ng-grid');

angular.module('lbd', [
    'ngCookies',
    'ngResource',
    'ui.router',
    'ngUpload',
    'ngGrid'
  ])
  .config(require('./config/log')())
  .config(require('./config/router')())
  .factory('Global', require('./services/global')())
  .filter('join', require('./filters/join')())
  // .factory('Orders', require('./services/orders')())
  .controller('IndexController', require('./controllers/index')())
  .controller('HeaderController', require('./controllers/header')())
  .controller('InventoryController', require('./controllers/inventory')())
  .controller('ManufactureController', require('./controllers/manufacture')())
  .controller('OrderController', require('./controllers/orders')());

angular.element(document).ready(function() {
  angular.bootstrap(document, ['lbd']);
});
