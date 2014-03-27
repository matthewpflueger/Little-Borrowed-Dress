'use strict';

module.exports = function() {

  function HeaderController($scope, Global) {
    $scope.global = Global;

    $scope.menu = [{
      'title': 'Inventory',
      'link': 'inventory/upload'
    }];

    $scope.isCollapsed = true;
  }

  HeaderController.$inject = ['$scope', 'Global'];

  return HeaderController;
};
