
const express = require("express");
const {
    processPayment,
    sendRazorpayApiKey,
} = require("../controllers/paymentController");
const paymentRoute = express.Router();
const { isAuthUser } = require("../middlewares/auth");

paymentRoute.route("/payment/process").post(isAuthUser, processPayment);

paymentRoute.route("/razorpayapikey").get(isAuthUser, sendRazorpayApiKey);

module.exports = paymentRoute;
