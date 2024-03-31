const Product = require('../models/productModel');
const ErrorHandler = require('../util/errorHandler');
const errorFunc = require('../middlewares/catchErrors');
const ApiFeatures = require('../util/apiFeatures');
const cloudinary = require('cloudinary');


//Create Product--Admin
exports.createProduct = errorFunc(async (req, res, next) => {
    try {

        let images = [];

        if (typeof req.body.images === "string") {
            images = req.body.images.split("'");
        } else {
            images = req.body.images;
        }
        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            try {
                const result = await cloudinary.v2.uploader.upload(images[i], {
                    folder: "Products",
                });

                imagesLinks.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                });
            } catch (err) {
                if (err && err.message && err.message.includes("Could not decode base64")) {
                    return next(new ErrorHandler('Unsupported image format', 400));
                } else {
                    throw err;
                }
            }
        }

        req.body.images = imagesLinks;
        req.body.user = req.user.id;

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            product,
        });
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
});

//Get All Product
exports.getAllProducts = errorFunc(async (req, res) => {
    try {
        const resultPerPage = 5;
        const productsCount = await Product.countDocuments();
        const apiFeature = new ApiFeatures(Product.find(), req.query).search().filter().pagination(resultPerPage);
        const products = await apiFeature.query.exec();
        let filteredProductsCount = products.length;
        res.status(200).json({
            success: true,
            products,
            productsCount,
            resultPerPage,
            filteredProductsCount,
        });
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Internal server error!', 500));
    }
});

// Get all products --admin
exports.getAdminProducts = errorFunc(async (req, res, next) => {
    try {
        const products = await Product.find();

        res.status(200).json({
            success: true,
            products,
        });
    }
    catch (Err) {
        console.log(Err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
});

//Get single Product
exports.getProductDetails = errorFunc(async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler('Product not found', 404))
        }

        res.status(200).json({
            success: true,
            product
        })
    }
    catch (Err) {
        console.log(Err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

//update Products --Admin
exports.updateProduct = errorFunc(async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Images Start Here
        let images = [];

        if (typeof req.body.images === 'string') {
            images = req.body.images.split("'");
        } else {
            images = req.body.images;
        }

        if (images !== undefined) {
            // Deleting Images From Cloudinary
            for (let i = 0; i < product.images.length; i++) {
                await cloudinary.v2.uploader.destroy(product.images[i].public_id);
            }

            const imagesLinks = [];

            for (let i = 0; i < images.length; i++) {
                try {
                    const result = await cloudinary.v2.uploader.upload(images[i], {
                        folder: "Products",
                    });

                    imagesLinks.push({
                        public_id: result.public_id,
                        url: result.secure_url,
                    });
                } catch (err) {
                    if (err && err.message && err.message.includes("Could not decode base64")) {
                        return next(new ErrorHandler('Unsupported image format', 400));
                    } else {
                        throw err;
                    }
                }
            }

            req.body.images = imagesLinks;
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });

        res.status(200).json({
            success: true,
            product,
        });
    } catch (Err) {
        console.log(Err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

// Delete Product --admin
exports.deleteProduct = errorFunc(async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Deleting Images From Cloudinary
        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: "Product Delete Successfully",
        });
    }
    catch (Err) {
        console.log(Err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
});

//Create new review or update the review
exports.createReview = errorFunc(async (req, res) => {
    try {
        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(req.body.rating),
            comment: req.body.comment
        }
        const product = await Product.findById(req.body.productId);
        const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString());
        if (isReviewed) {
            product.reviews.forEach((review) => {
                if (review.user.toString() === req.user._id.toString()) {
                    review.rating = Number(req.body.rating);
                    review.comment = req.body.comment;
                }
            });
        } else {
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length
        }
        let avg = 0;
        for (let i of product.reviews) {
            avg += i.rating;
        }
        product.ratings = (avg / product.reviews.length).toFixed(1);
        await product.save({
            validateBeforeSave: false
        });
        res.status(200).json({
            success: true,
            product
        })
    }
    catch (err) {
        console.log(err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})

//Get product reviews
exports.getProductReviews = errorFunc(async (req, res, next) => {
    try {
        const product = await Product.findById(req.query.id);
        if (!product) {
            return next(new ErrorResponse('No product found with that id', 404));
        }
        res.status(200).json({
            success: true,
            reviews: product.reviews
        })
    }
    catch (Err) {
        console.log(Err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
});

//Deleting user reviews
exports.deleteReview = errorFunc(async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(req.query.id);
        if (!product) {
            return next(new ErrorResponse("No product found", 404))
        }
        const reviews = product.reviews.filter(rev => rev._id.toString() !== req.query.id.tosTring());
        let avg = 0;
        for (let i of reviews) {
            avg += i.rating;
        }
        const ratings = (avg / reviews.length).toFixed(1);

        const numOfReviews = reviews.length;

        await product.findByIdAndUpdate(req.query.productId, {
            reviews,
            ratings,
            numOfReviews
        }, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        })
        res.status(200).json({
            success: true
        })
    }
    catch (Err) {
        console.log(Err);
        return next(new ErrorHandler('Internal server error!', 500));
    }
})