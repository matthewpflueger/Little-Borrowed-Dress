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
  }

  return MyController;
};
