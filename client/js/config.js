'use strict';

module.exports = function() {

  function Config($stateProvider, $urlRouterProvider, $locationProvider) {

    // For unmatched routes:
    $urlRouterProvider.otherwise('/');

    // states for my app
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/index.html'
      })
      .state('inventory', {
        url: '/inventory',
        templateUrl: 'views/inventory.html'
      })
      .state('orders', {
        url: '/orders',
        templateUrl: 'views/orders.html'
      });

    $locationProvider.hashPrefix('!');
  }

  Config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

  return Config;

};
