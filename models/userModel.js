const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name']
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: [true, 'Please provide your email'],
        validate: [validator.isEmail, 'Please Enter a valid Email'],
    },
    password: {
        type: String,
        required: [true, 'Please provide your Password'],
        minlength: [8, 'Password should be at least 8 characters long'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    resetPasswordToken: String,

    resetPasswordExpire: Date
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.getJwtToken = async function () {
    return jwt.sign({ id: this._id }, process.env.SECRET, { expiresIn: '24h' });
}

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.getResetPassword = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest("hex")

    this.resetPasswordExpire = Date.now() + 15 * 16 * 1000;

    return resetToken;
}

module.exports = mongoose.model('users', userSchema);