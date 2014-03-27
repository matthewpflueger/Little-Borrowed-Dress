'use strict';

module.exports = function() {

  function IndexController($scope, Global) {
    $scope.global = Global;
  }

  IndexController.$inject = ['$scope', 'Global'];

  return IndexController;
};
