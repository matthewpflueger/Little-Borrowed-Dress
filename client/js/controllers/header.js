'use strict';

module.exports = function() {

  function HeaderController($scope, Global) {
    $scope.global = Global;

    $scope.menu = [{
      'title': 'Inventory',
      'link': 'inventory'
    }, {
      'title': 'Orders',
      'link': 'orders'
    }];

    $scope.isCollapsed = false;
  }

  HeaderController.$inject = ['$scope', 'Global'];

  return HeaderController;
};
