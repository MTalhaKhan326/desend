const status = require('http-status')
const APIError = require('../utils/APIError')

const handleSequelizeUniqueConstraintError = (err) => {

    const error = new APIError(err.message, status.BAD_REQUEST)

    return error
}

const handleSequelizeValidationError = (err) => {

    const errMsgs = err.errors.map((error) => error.message)

    return new APIError(errMsgs[0], status.BAD_REQUEST)
}

const handleJsonWebTokenError = (err) => {

    const errMsg = 'Provide valid auth token'

    return new APIError(errMsg, status.BAD_REQUEST)
}

module.exports = (err, req, res, next) => {

    let error
    console.log("~~~~~~~~~~~~~~~~~~~~");
    console.log(err.name);

    if (err.name === 'SequelizeUniqueConstraintError')
        error = handleSequelizeUniqueConstraintError(err);

    else if (err.name === 'SequelizeValidationError')
        error = handleSequelizeValidationError(err);

    else if (err.type === 'StripeInvalidRequestError')
        error = new APIError('Provided account details are incorrect', 400);

    else if (err.name === 'JsonWebTokenError')
        error = handleJsonWebTokenError(err)

    else if (err instanceof APIError)
        error = new APIError(err.message, err.statusCode)

    else
        error = new APIError(
            'There is some internal error with server',
            status.INTERNAL_SERVER_ERROR
        )

    console.log(err);

    res.status(error.statusCode).json({
        status: 'failed',
        error: true,
        data: {
            message: error.message,
        }
    });

}
