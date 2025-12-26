const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        // Handle Photo Upload Path
        const userData = {
            ...req.body,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null
        };

        const result = await authService.registerUser(userData);

        res.status(201).json({
            message: 'User registered successfully',
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Safety check to prevent "Incorrect arguments" error
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const result = await authService.loginUser(email, password);

        res.json({
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: error.message });
    }
};

module.exports = { register, login };