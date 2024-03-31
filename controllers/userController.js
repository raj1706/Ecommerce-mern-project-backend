const ErrorHandler = require('../util/errorHandler');
const catchErrors = require('../middlewares/catchErrors');
const User = require('../models/userModel');
const sendToken = require('../util/jwtToken')
var SibApiV3Sdk = require('sib-api-v3-sdk');
const cloudinary = require('cloudinary');
const crypto = require('crypto');
//Register user
exports.registerUser = catchErrors(async (req, res, next) => {
    try {
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: 'scale'
        })
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return next(new ErrorHandler("Please provide all the required fields", 400))
        }
        const user = await User.create({
            name: name,
            email: email,
            password: password,
            avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        })

        sendToken(user, 201, res)
    }
    catch (Err) {
        console.log(Err);
        if (Err.code === 11000) {
            return next(new ErrorHandler("User already exist please login", 400));
        }
        if (Err && Err.message && err.message.includes("Could not decode base64")) {
            return next(new ErrorHandler('Unsupported image format', 400));
        }
        return next(new ErrorHandler("Internal server error!", 500));
    }
})

//Login user

exports.loginUser = catchErrors(async (req, res, next) => {
    try {

        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler("Please provide an email and a password", 400))
        }

        const user = await User.findOne({ email: email }).select('+password');

        if (!user) {
            return next(new ErrorHandler("User not exist please register yourself first", 404));
        }
        const isPasswordMatched = await user.comparePassword(password);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invalid credentials", 403));
        }

        sendToken(user, 200, res)
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Internal server error!", 500));
    }

})

//logout user
exports.logout = catchErrors(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: "Logged Out"
    })
})

//forget password

exports.forgetPassword = catchErrors(async (req, res, next) => {
    try {
        var user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new ErrorHandler(`No account associated with ${req.body.email}`, 404))
        }

        //get resetpassword token

        const resetToken = user.getResetPassword();

        await user.save({ validateBeforeSave: false });

        const resetPasswordUrl = `${process.env.FORGET_LINK}password/reset/${resetToken}`;

        const emailTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container">
                    <div class="jumbotron">
                        <h1 class="display-4">Password Reset</h1>
                        <p class="lead">Hello ${user.name},</p>
                        <p class="lead">You have requested to reset your password. Please click the following link to reset it:</p>
                        <a class="btn btn-primary" href="${resetPasswordUrl}" role="button">Reset Password</a>
                        <hr class="my-4">
                        <p class="lead">If you did not request this, please ignore this email.</p>
                        <p class="lead">Thank you</p>
                    </div>
                </div>
            </body>
            </html>
        `;


        var defaultClient = SibApiV3Sdk.ApiClient.instance;
        var apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.FORGETPASSWORDKEY;
        var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        const sender = { email: process.env.EMAIL };
        const receivers = [{ email: `${user.email}` }];
        apiInstance.sendTransacEmail({
            sender,
            to: receivers,
            subject: "Reset Password",
            htmlContent: emailTemplate
        }).then(() => {
            res.status(200).json({
                success: true,
                message: "Check your email for the link to reset your password."
            });
        });
    } catch (error) {
        console.log(error);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler('Internal server error!', 500));
    }
});

//Reset Password
exports.resetPassword = catchErrors(async (req, res, next) => {
    try {
        //Getting hashed token from url
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if (!user) {
            return next(new ErrorHandler("Invalid or expired token.", 400))
        }

        if (req.body.password !== req.body.confirmPassword) {
            return next(new ErrorHandler("Password and confirm password do not match.", 400))
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        sendToken(user, 200, res);
    } catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
}

)

//get user details
exports.getUserDetails = catchErrors(async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return next(new ErrorHandler('No user found', 404))
        }
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})


exports.updateUserPassword = catchErrors(async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return next(new ErrorHandler('No user found', 404))
        }
        const isPasswordMatched = user.comparePassword(req.body.oldPassword);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Old password is incorrect", 403));
        }

        if (req.body.newPassword !== req.body.confirmPassword) {
            return next(new ErrorHandler("New password and confirm password do not match", 401));
        }

        user.password = req.body.newPassword;
        await user.save();

        sendToken(user, 200, res);
    }
    catch (Err) {
        console.log(Err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})


//update user details
exports.updateUserDetails = catchErrors(async (req, res, next) => {
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email,
        };

        if (req.body.avatar !== "") {
            const user = await User.findById(req.user.id);

            const imageId = user.avatar.public_id;

            await cloudinary.v2.uploader.destroy(imageId);

            const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
                folder: "avatars",
                width: 150,
                crop: "scale",
            });

            newUserData.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });

        res.status(200).json({
            success: true,
        });
    } catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

//Get all users
exports.getAllUser = catchErrors(async (req, res, next) => {
    try {
        const users = await User.find();
        if (!users) {
            return next(new ErrorHandler(`There is no users`, 404))
        }
        res.status(200).json({
            success: true,
            users
        })
    }
    catch (error) {
        console.log(error);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

//Getting single user
exports.getSingleUser = catchErrors(async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
        res.status(200).json({
            success: true,
            user
        })
    }
    catch (error) {
        console.log(error);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

//Update user role to admin or user
exports.updateUserRole = catchErrors(async (req, res, next) => {
    try {
        const Data = {
            role: req.body.role
        }

        const user = await User.findByIdAndUpdate(req.params.id, Data, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        })

        res.status(200).json({
            success: true,
            user
        })
    }
    catch (error) {
        console.log(error);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

//Delete user
exports.deleteUser = catchErrors(async (req, res, next) => {
    try {
        const user = await User.deleteOne({ _id: req.params.id });
        res.status(200).json({
            success: true,
            message: "Deleted Successfully"
        });
    }
    catch (error) {
        console.log(error);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})