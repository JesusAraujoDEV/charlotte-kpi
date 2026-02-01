const express = require('express');

const { financialController } = require('../controllers/financial.controller');
const { operationsController } = require('../controllers/operations.controller');
const { productController } = require('../controllers/product.controller');
const { inventoryController } = require('../controllers/inventory.controller');
const { cxController } = require('../controllers/cx.controller');
const { workforceController } = require('../controllers/workforce.controller');
const { dashboardController } = require('../controllers/dashboard.controller');

const kpiRouter = express.Router();

kpiRouter.get('/financial/daily-revenue', financialController.dailyRevenue);
kpiRouter.get('/financial/aov', financialController.aov);
kpiRouter.get('/financial/lost-revenue', financialController.lostRevenue);

kpiRouter.get('/operations/kitchen-velocity', operationsController.kitchenVelocity);
kpiRouter.get('/operations/delivery-success-rate', operationsController.deliverySuccessRate);
kpiRouter.get('/operations/critical-alerts', operationsController.criticalAlerts);

kpiRouter.get('/product/top-sellers', productController.topSellers);
kpiRouter.get('/product/menu-availability', productController.menuAvailability);

kpiRouter.get('/inventory/low-stock', inventoryController.lowStock);
kpiRouter.get('/inventory/waste-tracker', inventoryController.wasteTracker);

kpiRouter.get('/cx/service-quality', cxController.serviceQuality);
kpiRouter.get('/cx/room-occupancy', cxController.roomOccupancy);
kpiRouter.get('/cx/ghost-clients', cxController.ghostClients);

kpiRouter.get('/workforce/orders-per-chef', workforceController.ordersPerChef);

kpiRouter.get('/dashboard/overview', dashboardController.overview);

module.exports = { kpiRouter };
