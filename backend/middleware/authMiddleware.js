const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set before starting the API.');
}

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authorized, token missing' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
    }
};

const optionalAuth = async (req, res, next) => {
    // Used by the public chatbot: never trust a userId from the request body,
    // but honour a valid token if one is present.
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
    } catch {
        // Invalid/expired token: continue as an anonymous caller.
    }
    next();
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied: Admins only' });
};

module.exports = { protect, optionalAuth, adminOnly };
