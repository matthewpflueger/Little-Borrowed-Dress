'use strict';

module.exports = function() {
  console.log('Inside MyController file');

  function MyController($scope) {
    $scope.clock = new Date();
    var updateClock = function() {
      $scope.clock = new Date();
    };
    setInterval(function() { $scope.$apply(updateClock); }, 1000);
    updateClock();

    $scope.startUploading = function() {
      console.log('uploading....');
    };

    $scope.uploadComplete = function (content) {
      console.log(content);
      $scope.response = content; // Presumed content is a json string!
      $scope.response.style = {
        color: $scope.response.color,
        'font-weight': 'bold'
      };
    };

    $scope.myData = [{name: 'Moroni', age: 50},
                     {name: 'Tiancum', age: 43},
                     {name: 'Jacob', age: 27},
                     {name: 'Nephi', age: 29},
                     {name: 'Enos', age: 34}];
    $scope.gridOptions = { data: 'myData' };
  }

  MyController.$inject = ['$scope'];

  return MyController;
};
