const { default: mongoose } = require("mongoose");
const ErrorHandler = require("../util/errorHandler");


module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    //Handling CastError
    if (err instanceof mongoose.CastError) {
        const message = `Resource not found with ID: ${err.value}`;
        const error = new ErrorHandler(message, 400);
    }

    if (err.code === 11000) {
        const message = "Duplicate field entered";
        const error = new ErrorHandler(message, 400);
    }

    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token"
        const error = new ErrorHandler(message, 401)
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}