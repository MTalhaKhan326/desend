
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { success, fail } = require('../utils/Error');
exports.auth = (req, res, next) => {
    const token = req.header('authToken', process.env.JWT_SECRET_KEY)
    if (!token) {
        return res.json
            ({
                status: fail,
                message: "access denied no token provided ",
            })
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.user = payload
        next()
    }
    catch (ex) {
        res.json({
            status: fail,
            message: ex,
        })
    }
}
