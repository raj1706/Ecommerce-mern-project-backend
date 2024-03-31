const app = require("./app");
const dotenv = require('dotenv');
const connectDatabase = require("./config/database");
const cloudinary = require('cloudinary');
const cors = require('cors');
dotenv.config();

//handling uncaught exception
process.on('uncaughtException', (err) => {
    console.log(`Uncaught Exception: ${err}`);
    process.exit(1)
})

//connecting to database

connectDatabase();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})

//unhandled promise rejection 
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`)
    server.close(() => process.exit(1));
});
