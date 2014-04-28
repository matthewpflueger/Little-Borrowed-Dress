'use strict';

module.exports = function(_, moment) {

  _ = _ || require('lodash');
  moment = moment || require('moment');

  function InventoryController($scope, $log, $http) {

    function findEntity(inventory, reservationId) {
      return _.find(makeInventoryReservationRows(inventory), function(e) {
        return reservationId === e.reservation.id;
      });
    }

    function makeInventoryReservationRows(inventory) {
      if (!inventory) {
        return [];
      }
      if (inventory.id) {
        inventory = [inventory];
      }

      var rows = [];
      _.forEach(inventory, function(i) {
        var row = { inventory: i };
        rows.push(row);
        _.forEach(i.reservations, function(r) {
          row.reservation = r;
        });
      });
      return rows;
    }


    $scope.isInventoryReceivable = function() {
      return false;
    };

    $scope.receiveInventory = function() {};

    $scope.isCleanable = function() {
      return false;
    };

    $scope.sendToCleaners = function() {};

    $scope.$on('ngGridEventEndCellEdit', function(evt) {
      var row = evt.targetScope.row;
      var entity = row.entity;
      //FIXME this logic is duplicated in the client/js/controllers/order and here and the Order model :(
      if (entity.inventory.itemDescription[0].size.match) {
        entity.inventory.itemDescription[0].size = entity.inventory.itemDescription[0].size.match(/\d+/g);
      }

      $http
        .put('/inventory/' + entity.inventory._id, entity.inventory)
        .success(function(data, status) {
          $log.info('Saved inventory=%s, status=%s, data=%O', entity.inventory.tagId, status, data);
          var e = findEntity(data.inventory, entity.reservation.id);
          if (e) {
            $log.info('Found entity=%O', e);
            row.entity = e;
          }
        }).error(function(data, status) {
          $log.error(
            'Could not save inventory=%s, status=%s, data=%O',
            entity.inventory.tagId, status, data);
          var e = findEntity(data, entity.reservation.id);
          if (e) {
            $log.info('Found entity=%O', e);
            row.entity = e;
          }
        });

    });


    $scope.enteredInventoryForStyle = '';
    $scope.enteredInventoryForColor = '';
    $scope.enteredInventoryForSize = '';
    $scope.enteredInventoryForDate = null;
    $scope.limitToOptions = [10, 25, 50, 100, 200];
    $scope.previousPagesForDate = [];

    $scope.inventoryQuery = {
      inclusive: false,
      createdOn: null,
      inventoryForDate: null,
      style: null,
      color: null,
      size: null,
      limitTo: 10
    };

    function debounce(fun, timeout) {
      return _.debounce(fun, timeout || 500);
    }

    //FIXME need to debounce!!!
    //FIXME this is freaking hideous!!!
    $scope.$watch('enteredInventoryForStyle', debounce(function (dt) {
      if (!dt || !/^[a-z]{3,}$/.test(dt)) {
        $scope.inventoryQuery.style = null;
        return;
      }

      $log.info('Saw update to enteredInventoryForStyle=%s', dt);
      $scope.inventoryQuery.style = dt;
      $scope.all();
    }));

    $scope.$watch('enteredInventoryForColor', debounce(function (dt) {
      if (!dt || !/^[a-z]{3,}$/.test(dt)) {
        $scope.inventoryQuery.color = null;
        return;
      }

      $log.info('Saw update to enteredInventoryForColor=%s', dt);
      $scope.inventoryQuery.color = dt;
      $scope.all();
    }));

    $scope.$watch('enteredInventoryForSize', debounce(function (dt) {
      if (!dt || !/\d+/.test(dt)) {
        $scope.inventoryQuery.size = null;
        return;
      }

      $log.info('Saw update to enteredInventoryForSize=%s', dt);
      $scope.inventoryQuery.size = dt.match(/(\d+)/g);
      $scope.all();
    }));
      // //FIXME this logic is duplicated in the client/js/controllers/order and here and the Order model :(
      // if (entity.inventory.itemDescription[0].size.match) {
      //   entity.inventory.itemDescription[0].size = entity.inventory.itemDescription[0].size.match(/\d+/g);
      // }
    $scope.$watch('enteredInventoryForDate', debounce(function (dt) {
      if (!dt || !/^(\d){1,2}\/(\d){1,2}\/(\d){2,4}$/.test(dt)) {
        $scope.inventoryQuery.inventoryForDate = null;
        return;
      }

      $log.info('Saw update to enteredInventoryForDate %s', dt);
      $scope.previousPagesForDate = [];
      $scope.inventoryQuery.inventoryForDate = new Date(dt).toISOString();
      $scope.all();
    }));

    $scope.$watch('inventoryQuery.limitTo', function() {
      $scope.all();
    });

    $scope.datesForPaging = function() {
      var inv = $scope.inventoryData;
      if (!inv.length || !inv[0] || !inv[0].inventory) {
        return false;
      }

      return {
        startDate: inv[0].inventory.createdOn,
        endDate: inv[inv.length - 1].inventory.createdOn
      };
    };

    $scope.nextPage = function() {
      var dates = $scope.datesForPaging();
      if (!dates) {
        $log.warn('No inventory to go to next page of');
        return;
      }

      var iq = $scope.inventoryQuery;

      $scope.previousPagesForDate.push(dates.startDate);
      iq.createdOn = dates.endDate;
      iq.inclusive = false;
      $scope.all();
    };

    $scope.previousPage = function() {
      if (!$scope.previousPagesForDate.length) {
        $log.error('Trying to go to previous page of inventory when no previousPageForDate set');
        return;
      }

      var iq = $scope.inventoryQuery;
      iq.createdOn = $scope.previousPagesForDate.pop();
      iq.inclusive = true;
      $scope.all();
    };

    $scope.all = function() {
      var iq = $scope.inventoryQuery;
      var config = { params: iq };

      $http
        .get('/inventory', config)
        .success(function(data, status) {
          $log.info('Fetched inventory=%O, status=%s', data, status);

          $scope.inventoryData = makeInventoryReservationRows(data);
        }).error(function(data, status) {
          if (status === 404) {
            $log.info('No inventory found');
            $scope.inventoryData = [];
            return;
          }
          $log.error('Failed to fetch inventory data=%O, status=%s', data, status);
          var error = new Error('Failed to fetch inventory');
          error.data = { data: data, status: status };
          throw error;
        });
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
      // enablePinning: true,  //does not work with grouping :(
      showFilter: true,
      showColumnMenu: true,
      enableCellEdit: true,
      enableColumnResize: true,
      enableColumnReordering: true,
      sortInfo: { fields: ['reservation.reservationStart'], directions: ['desc']},
      columnDefs: [
        {field:'inventory.tagId', displayName:'Tag Id', enableCellEdit: true, width: 100},
        {field:'inventory.productNumber', displayName:'Prod #', enableCellEdit: true, width: 80},
        {field:'inventory.manufacturedOn', displayName:'Manufactured On', enableCellEdit: false, width: 110, cellFilter: 'date'},
        {field:'inventory.itemDescription[0].style', displayName:'Style', enableCellEdit: true, width: 70},
        {field:'inventory.itemDescription[0].color', displayName:'Color', enableCellEdit: true, width: 70},
        {field:'inventory.itemDescription[0].size', displayName:'Size', enableCellEdit: true, width: 70, cellFilter: 'join:" | "'},
        {field:'inventory.status', displayName:'Status', enableCellEdit: true, width: 70},
        {field:'inventory.location', displayName:'Location', enableCellEdit: true, width: 90},
        {field:'reservation.type', displayName:'Type', width: 80, enableCellEdit: false},
        {field:'reservation.reservationStart', displayName:'Start', width: 100, enableCellEdit: true, cellFilter: 'date'},
        {field:'reservation.reservationEnd', displayName:'End', width: 100, enableCellEdit: true, cellFilter: 'date'},
        {field:'reservation.forDate', displayName:'For Date', width: 100, enableCellEdit: false, cellFilter: 'date'},
        {field:'reservation.backup', displayName:'Backup', enableCellEdit: false, width: 70},
        {field:'reservation.orderNumber', displayName:'Order', enableCellEdit: false, width: 90},
        {field:'reservation.name', displayName: 'Name', enableCellEdit: false, width: 150},
        {field:'reservation.email', displayName: 'Email', enableCellEdit: false, width: 150},
        {field:'reservation.telephone', displayName: 'Phone', enableCellEdit: false, width: 100},
      ]
    };

    function makeReservationData() {
      if (!$scope.inventorySelections.length) {
        return;
      }
      $log.info('inventorySelections=%O', $scope.inventorySelections);
      $scope.reservationData = $scope.inventorySelections[0].inventory.reservations;
    }

    $scope.$watchCollection('inventorySelections', makeReservationData);

    $scope.reservationData = [];

    $scope.resGridOptions = {
      data: 'reservationData',
      enableCellSelection: false,
      multiSelect: false,
      enableColumnResize: true,
      enableColumnReordering: false,
      columnDefs: [
        {field:'type', displayName:'Type', width: 80, enableCellEdit: false},
        {field:'reservationStart', displayName:'Start', width: 100, enableCellEdit: false, cellFilter: 'date'},
        {field:'reservationEnd', displayName:'End', width: 100, enableCellEdit: false, cellFilter: 'date'},
        {field:'forDate', displayName:'For Date', width: 100, enableCellEdit: false, cellFilter: 'date'},
        {field:'backup', displayName:'Backup', enableCellEdit: false, width: 70},
        {field:'orderNumber', displayName:'Order', enableCellEdit: false, width: 90},
        {field:'name', displayName: 'Name', enableCellEdit: false, width: 150},
        {field:'email', displayName: 'Email', enableCellEdit: false, width: 150},
        {field:'telephone', displayName: 'Phone', enableCellEdit: false, width: 100},
      ]
    };

    $scope.isUploading = false;
    $scope.startUploading = function() {
      $scope.isUploading = true;
    };

    $scope.uploadComplete = function(inventory) {
      $log.info('Completed upload of inventory=%O', inventory);
      $scope.isUploading = false;
      global.jQuery('#uploadInventoryModal').modal('hide');

      $scope.inventoryData = makeInventoryReservationRows(inventory);
    };
  }

  InventoryController.$inject = ['$scope', '$log', '$http'];

  return InventoryController;
};
