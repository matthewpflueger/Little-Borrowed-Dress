'use strict';

module.exports = function() {
  console.log('Inside OrderController file');

  function OrderController($scope) {
    $scope.isUploading = false;
    $scope.startUploading = function() {
      console.log('uploading....');
      $scope.isUploading = true;
    };

    $scope.uploadComplete = function (content) {
      console.log(content);
      $scope.isUploading = false;
      $scope.response = content.response;
      $scope.orderData = content.customerData;
    };

    $scope.orderData = [];
    $scope.orderSelections = [];
    $scope.gridOptions = {
      data: 'orderData',
      selectedItems: $scope.orderSelections,
      showGroupPanel: true,
      jqueryUIDraggable: true,
      enableCellSelection: true,
      multiSelect: false,
      columnDefs: [
        // {field:'SHIP DATE', displayName:'Ship Date'},
        // {field:'WEDDING DATE', displayName:'Wedding Date'},
        {field:'ORDER', displayName:'Order'},
        {field:'BRIDE', displayName:'Bride'},
        {field:'STYLE', displayName:'Style'},
        {field:'SIZE', displayName:'Size'},
        {field:'COLOR', displayName:'Color'}
      ]
    };
  }

  OrderController.$inject = ['$scope'];

  return OrderController;
};
