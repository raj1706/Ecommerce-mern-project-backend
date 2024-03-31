const express = require('express');
const orderRouter = express.Router();
const { isAuthUser, authorizeRoles } = require('../middlewares/auth');
const { newOrder, getSingleOrder, getUserOrder, getAllOrder, updateOrderStatus, deleteOrder } = require('../controllers/orderController');

orderRouter.route('/order/new').post(isAuthUser, newOrder);
orderRouter.route('/order/:id').get(isAuthUser, getSingleOrder);
orderRouter.route('/orders/me').get(isAuthUser, getUserOrder);
orderRouter.route('/admin/orders').get(isAuthUser, authorizeRoles('admin'), getAllOrder);
orderRouter.route('/admin/order/:id').put(isAuthUser, authorizeRoles('admin'), updateOrderStatus).delete(isAuthUser, authorizeRoles('admin'), deleteOrder)

module.exports = orderRouter;