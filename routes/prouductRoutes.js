const express = require('express');
const { getAllProducts, createProduct, updateProduct, deleteProduct, getProductDetails, getAdminProducts } = require('../controllers/productController');
const { isAuthUser, authorizeRoles } = require('../middlewares/auth');

const productRouter = express.Router();

productRouter.route('/products').get(getAllProducts);

productRouter
    .route("/admin/products")
    .get(isAuthUser, authorizeRoles("admin"), getAdminProducts);

productRouter.route('/admin/product/new').post(isAuthUser, authorizeRoles('admin'), createProduct);

productRouter.route('/admin/product/:id').put(isAuthUser, authorizeRoles('admin'), updateProduct).delete(isAuthUser, authorizeRoles('admin'), deleteProduct);

productRouter.route("/product/:id").get(getProductDetails);


module.exports = productRouter;