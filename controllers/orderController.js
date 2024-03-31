const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../util/errorHandler');
const errorFunc = require('../middlewares/catchErrors');

//create new order
exports.newOrder = errorFunc(async (req, res, next) => {
    try {
        const {
            shippingInfo,
            orderItems,
            paymentInfo,
            taxPrice,
            shippingPrice,
            totalPrice
        } = req.body;

        // Create an array to store the formatted order items
        const formattedOrderItems = orderItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            product: item.product,
        }));

        // Calculate the total items price
        const calculatedItemsPrice = formattedOrderItems.reduce((total, item) => total + item.price * item.quantity, 0);
        // Create the order
        const order = await Order.create({
            shippingInfo,
            orderItems: formattedOrderItems,
            paymentInfo: {
                id: paymentInfo.id.razorpay_payment_id,
                status: paymentInfo.status
            },
            itemsPrice: calculatedItemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paidAt: new Date(),
            user: req.user._id,
            status: 'paid',
            orderStatus: 'Processing',
        });

        res.status(201).json({
            success: true,
            order
        });
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }

});

exports.getSingleOrder = errorFunc(async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) {
            return next(new ErrorHandler(`No order found with id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            order
        })
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

exports.getUserOrder = errorFunc(async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user.id });
        if (!orders) {
            return next(new ErrorHandler(`No order found with id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            orders
        })
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

exports.getAllOrder = errorFunc(async (req, res, next) => {
    try {
        const orders = await Order.find();
        if (!orders) {
            return next(new ErrorHandler(`No order found with id ${req.params.id}`, 404));
        }
        let totalAmount = 0;
        orders.forEach(order => {
            totalAmount += order.totalPrice
        });

        res.status(200).json({
            success: true,
            totalAmount,
            orders
        })
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

exports.updateOrderStatus = errorFunc(async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new ErrorHandler(`No order found with id ${req.params.id}`, 404));
        }
        if (order.orderStatus === "Delivered") {
            return next(new ErrorHandler("This order has already been delivered", 403));
        }


        order.orderStatus = req.body.status;
        if (req.body.status === 'Delivered') {
            order.deliveredAt = Date.now()
            order.orderItems.forEach(async o => {
                await updateStocks(o.product, o.quantity)
            });
        }
        await order.save({
            validateBeforeSave: false
        })
        res.status(200).json({
            success: true,
            message: 'Updated'
        })
    } catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

exports.deleteOrder = errorFunc(async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new ErrorHandler(`No order found with id ${req.params.id}`, 404));
        }
        await order.deleteOne()

        res.status(200).json({
            success: true,
            message: 'deleted'
        })
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

async function updateStocks(id, quantity) {
    try {
        const product = await Product.findById(id);
        product.Stock -= quantity;

        await product.save({
            validateBeforeSave: false
        })
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
}