
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

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDksImlhdCI6MTY2NDk3Nzc4OH0.r9PL1e8sFVg3lne0DOc19QC0783pxW3I0_T5hq7Lw5E
