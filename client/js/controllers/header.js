'use strict';

module.exports = function() {

  function HeaderController($scope, Global) {
    $scope.global = Global;
  }

  HeaderController.$inject = ['$scope', 'Global'];

  return HeaderController;
};
