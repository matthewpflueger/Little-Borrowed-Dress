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
      .state('inventory upload', {
        url: '/inventory/upload',
        templateUrl: 'views/inventory.html'
      });

    $locationProvider.hashPrefix('!');
  }

  Config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

  return Config;

};
