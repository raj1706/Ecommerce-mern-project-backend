const { default: mongoose } = require("mongoose");
const ErrorHandler = require("../util/errorHandler");


const connectDatabase = () => {
    try {
        mongoose.connect(process.env.DB_URL).then(() => {
            console.log("Mongodb connected");
        });
    }
    catch (Err) {
        console.log(Err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
}

module.exports = connectDatabase