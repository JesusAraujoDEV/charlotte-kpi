const express = require('express');

const { cacheResponse } = require('../middleware/responseCache');

const { financialController } = require('../controllers/financial.controller');
const { operationsController } = require('../controllers/operations.controller');
const { productController } = require('../controllers/product.controller');
const { inventoryController } = require('../controllers/inventory.controller');
const { cxController } = require('../controllers/cx.controller');
const { workforceController } = require('../controllers/workforce.controller');
const { dashboardController } = require('../controllers/dashboard.controller');

const kpiRouter = express.Router();

const TTL = {
	financial: 60_000,
	operational: 5_000,
	overview: 5_000,
	product: 60_000,
	inventory: 30_000,
	cx: 5_000,
	workforce: 5_000,
};

kpiRouter.get('/financial/daily-revenue', cacheResponse({ ttlMs: TTL.financial }), financialController.dailyRevenue);
kpiRouter.get('/financial/aov', cacheResponse({ ttlMs: TTL.financial }), financialController.aov);
kpiRouter.get('/financial/lost-revenue', cacheResponse({ ttlMs: TTL.financial }), financialController.lostRevenue);

kpiRouter.get('/operations/kitchen-velocity', cacheResponse({ ttlMs: TTL.operational }), operationsController.kitchenVelocity);
kpiRouter.get('/operations/delivery-success-rate', cacheResponse({ ttlMs: TTL.operational }), operationsController.deliverySuccessRate);
kpiRouter.get('/operations/critical-alerts', cacheResponse({ ttlMs: TTL.operational }), operationsController.criticalAlerts);

kpiRouter.get('/product/top-sellers', cacheResponse({ ttlMs: TTL.product }), productController.topSellers);
kpiRouter.get('/product/menu-availability', cacheResponse({ ttlMs: TTL.product }), productController.menuAvailability);

kpiRouter.get('/inventory/low-stock', cacheResponse({ ttlMs: TTL.inventory }), inventoryController.lowStock);
kpiRouter.get('/inventory/waste-tracker', cacheResponse({ ttlMs: TTL.inventory }), inventoryController.wasteTracker);

kpiRouter.get('/cx/service-quality', cacheResponse({ ttlMs: TTL.cx }), cxController.serviceQuality);
kpiRouter.get('/cx/room-occupancy', cacheResponse({ ttlMs: TTL.cx }), cxController.roomOccupancy);
kpiRouter.get('/cx/ghost-clients', cacheResponse({ ttlMs: TTL.cx }), cxController.ghostClients);
kpiRouter.get('/cx/satisfaction-score', cacheResponse({ ttlMs: TTL.cx }), cxController.satisfactionScore);

kpiRouter.get('/workforce/orders-per-chef', cacheResponse({ ttlMs: TTL.workforce }), workforceController.ordersPerChef);
kpiRouter.get('/workforce/waiter-ranking', cacheResponse({ ttlMs: TTL.workforce }), workforceController.waiterRanking);

kpiRouter.get('/dashboard/overview', cacheResponse({ ttlMs: TTL.overview }), dashboardController.overview);

module.exports = { kpiRouter };
