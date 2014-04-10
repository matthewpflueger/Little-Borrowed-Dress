'use strict';

module.exports = function() {

  function InventoryController($scope) {
    $scope.isUploading = false;
    $scope.startUploading = function() {
      $scope.isUploading = true;
    };

    $scope.uploadComplete = function (content) {
      console.log(content);
      $scope.isUploading = false;
      $scope.response = content.response;
      $scope.inventoryData = content.inventoryData;
    };

    $scope.inventoryData = [];
    $scope.inventorySelections = [];
    $scope.gridOptions = {
      data: 'inventoryData',
      selectedItems: $scope.inventorySelections,
      showGroupPanel: true,
      jqueryUIDraggable: true,
      enableCellSelection: true,
      multiSelect: false,
      columnDefs: [
        {field:'Style', displayName:'Style'},
        {field:'Size', displayName:'Size'},
        {field:'Color', displayName:'Color'},
        {field:'Status', displayName:'Status'}
      ]
    };
  }

  InventoryController.$inject = ['$scope'];

  return InventoryController;
};
