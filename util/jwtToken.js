const sendToken = async (user, statusCode, res) => {
    const token = await user.getJwtToken();

    const options = {
        httpOnly: true,
    };


    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        user,
        token
    })
}

module.exports = sendToken;
