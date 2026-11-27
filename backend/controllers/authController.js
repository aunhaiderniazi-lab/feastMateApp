const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const tokenFor = (user) => jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required.' });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        }
        const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
        if (existing) return res.status(409).json({ message: 'Email is already registered.' });

        const user = await User.create({
            name: String(name).trim(),
            email: String(email).toLowerCase().trim(),
            password: await bcrypt.hash(password, 10)
        });
        res.status(201).json({
            _id: user._id, name: user.name, email: user.email, role: user.role,
            token: tokenFor(user)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
        if (!user || !(await bcrypt.compare(String(password || ''), user.password))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        res.status(200).json({
            _id: user._id, name: user.name, email: user.email, role: user.role,
            token: tokenFor(user)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { register, login };
