const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

const protect = async (req, res, next) => {
    let token;

    if (req.cookies?.smartspend_token) {
        token = req.cookies.smartspend_token;
    }

    // Keep Authorization header support for API tools and older clients.
    if (
        !token &&
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return next(new ErrorResponse("User no longer exists", 401));
        }

        next();
    } catch (error) {
        return next(new ErrorResponse("Not authorized to access this route", 401));
    }
};

module.exports = { protect };
