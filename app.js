const express = require('express');
const errorMiddleWare = require('./middlewares/error');
const cookieParser = require('cookie-parser')
const bodyparser = require('body-parser');
const filelUpload = require('express-fileupload')
const cors = require('cors');

const app = express();
const corsOptions = {
    origin: '*',
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(filelUpload());

//Route Imports
const productRouter = require('./routes/prouductRoutes');
const userRouter = require('./routes/userRoute');
const orderRouter = require('./routes/orderRoute');
const paymentRoute = require('./routes/paymentRoute');
app.use('/api/v1', productRouter)
app.use('/api/v1', userRouter);
app.use('/api/v1', orderRouter);
app.use('/api/v1', paymentRoute)

//Middleware for Errors
app.use(errorMiddleWare)


module.exports = app;