const express = require('express');
const { registerUser, loginUser, logout, forgetPassword, resetPassword, getUserDetails, updateUserPassword, updateUserDetails, getAllUser, updateUserRole, deleteUser, getSingleUser } = require('../controllers/userController');
const userRouter = express.Router();
const { isAuthUser, authorizeRoles } = require('../middlewares/auth');
const { createReview, getProductReviews, deleteReview } = require('../controllers/productController');

userRouter.route('/register').post(registerUser);
userRouter.route('/login').post(loginUser);
userRouter.route('/logout').get(logout);
userRouter.route('/password/forgot').post(forgetPassword);
userRouter.route('/password/reset/:token').put(resetPassword)
userRouter.route('/me').get(isAuthUser, getUserDetails)
userRouter.route('/password/update').put(isAuthUser, updateUserPassword)
userRouter.route('/me/update').put(isAuthUser, updateUserDetails)
userRouter.route('/admin/users').get(isAuthUser, authorizeRoles('admin'), getAllUser);
userRouter.route('/admin/user/:id').get(isAuthUser, authorizeRoles('admin'), getSingleUser).put(isAuthUser, authorizeRoles('admin'), updateUserRole).delete(isAuthUser, authorizeRoles('admin'), deleteUser);
userRouter.route('/review').put(isAuthUser, createReview)
userRouter.route('/reviews').get(getProductReviews).delete(isAuthUser, deleteReview)
module.exports = userRouter;