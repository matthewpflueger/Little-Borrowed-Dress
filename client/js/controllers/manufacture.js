'use strict';

module.exports = function(_, moment) {

  _ = _ || require('lodash');
  moment = moment || require('moment');

  function ManufactureController($scope, $log, $http) {


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


    $scope.enteredInventoryForStyle = '';
    $scope.enteredInventoryForColor = '';
    $scope.enteredInventoryForSize = '';
    $scope.enteredInventoryForDate = null;
    $scope.limitToOptions = [10, 25, 50, 100, 200];
    $scope.previousPagesForDate = [];

    $scope.inventoryQuery = {
      inclusive: false,
      hideSent: true,
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

    $scope.$watch('inventoryQuery.hideSent', function() {
      $scope.all();
    });

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

    $scope.manufactureInventory = function() {
      var sel = $scope.inventorySelections;
      if (sel.length === 0) {
        $log.error('No inventory selected to manufacture');
        return;
      }

      var data = _.map(sel, function(s) {
        return {
          orderNumber: s.reservation.orderNumber,
          inventory: s.inventory.id
        };
      });

      $log.debug('About to send to manufacturer inventory=%O', data);

      $http
        .post('/manufacture', data)
        .success(function(data, status) {
          $log.info('Fetched inventory=%O, status=%s', data, status);
          _.assign($scope.success, data);
          $scope.all();
        })
        .error(function(data, status) {
          $log.error('Failed to send inventory to manufacturer data=%O, status=%s', data, status);
          $scope.error.message = 'Failed to send inventory to manufacturer';
        });
    };

    $scope.all = function() {
      var iq = $scope.inventoryQuery;
      var config = { params: iq };

      $scope.info.message = null;
      $http
        .get('/inventory/manufacture', config)
        .success(function(data, status) {
          $log.info('Fetched inventory=%O, status=%s', data, status);
          $scope.inventoryData = makeInventoryReservationRows(data);
        }).error(function(data, status) {
          if (status === 404) {
            $scope.inventoryData = [];
            $scope.info.message = 'No inventory found to manufacture.';
            return;
          }
          $log.error('Failed to fetch inventory data=%O, status=%s', data, status);
          $scope.error.message = 'Failed to fetch inventory.';
        });
    };

    $scope.inventoryData = [];
    $scope.inventorySelections = [];
    $scope.gridOptions = {
      data: 'inventoryData',
      selectedItems: $scope.inventorySelections,
      pinSelectionCheckbox: true,
      selectWithCheckboxOnly: true,
      showSelectionCheckbox: true,
      showGroupPanel: true,
      jqueryUIDraggable: true,
      enableCellSelection: false,
      multiSelect: true,
      // enablePinning: true,  //does not work with grouping :(
      showFilter: true,
      showColumnMenu: true,
      enableCellEdit: false,
      enableColumnResize: true,
      enableColumnReordering: true,
      sortInfo: { fields: ['reservation.reservationStart'], directions: ['desc']},
      columnDefs: [
        {field:'inventory.tagId', displayName:'Tag Id', enableCellEdit: true, width: 100},
        {field:'inventory.productNumber', displayName:'Prod #', enableCellEdit: true, width: 80},
        {field:'inventory.manufactureRequestedOn', displayName:'Manufacture Requested On', enableCellEdit: false, width: 110, cellFilter: 'date'},
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

    $scope.success = {
      message: null
    };

    $scope.clearSuccess = function() {
      $scope.success.message = null;
    };

    $scope.info = {
      message: null
    };

    $scope.clearInfo = function() {
      $scope.info.message = null;
    };

    $scope.warning = {
      message: null
    };

    $scope.clearWarning = function() {
      $scope.warning.message = null;
    };

    $scope.error = {
      message: null
    };

    $scope.clearError = function() {
      $scope.error.message = null;
    };
  }

  ManufactureController.$inject = ['$scope', '$log', '$http'];

  return ManufactureController;
};
