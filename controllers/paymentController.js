const catchError = require("../middlewares/catchErrors");
const Razorpay = require("razorpay");
const shortid = require("shortid");
require('dotenv').config();
const ErrorHandler = require('../util/errorHandler');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAYKEYID,
    key_secret: process.env.RAZORPAYSECRET,
});

exports.processPayment = catchError(async (req, res, next) => {
    try {
        const amount = req.body.amount;
        const currency = "INR";
        const options = {
            amount: amount * 100,
            currency: currency,
            receipt: shortid.generate(),
            payment_capture: 1,
        };

        const order = await razorpay.orders.create(options);
        const responseData = {
            options: {
                key: process.env.RAZORPAYKEYID,
                currency: currency,
                id: order.id,
                amount: amount
            },
        };

        res.status(200).json(responseData);
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
});

exports.sendRazorpayApiKey = catchError(async (req, res, next) => {
    res.status(200).json({ razorpayApiKey: process.env.RAZORPAYKEYID });
});