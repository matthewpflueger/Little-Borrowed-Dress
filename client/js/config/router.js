'use strict';

module.exports = function() {

  function Config($stateProvider, $urlRouterProvider, $locationProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/index.html'
      })
      .state('inventory', {
        url: '/inventory',
        template: '<div ui-view><div ui-view>',
      })
      .state('inventory.manage', {
        url: '/manage',
        templateUrl: 'views/inventory/manage.html'
      })
      .state('inventory.manufacture', {
        url: '/manufacture',
        templateUrl: 'views/inventory/manufacture.html'
      })
      .state('inventory.upload', {
        url: '/upload',
        templateUrl: 'views/inventory/upload.html'
      })
      .state('orders', {
        url: '/orders',
        template: '<div ui-view><div ui-view>',
        // templateUrl: 'views/orders.html'
      })
      .state('orders.manage', {
        url: '/manage',
        templateUrl: 'views/orders/manage.html'
      })
      .state('orders.upload', {
        url: '/upload',
        templateUrl: 'views/orders/upload.html'
      });

    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('!');
  }

  Config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

  return Config;

};
