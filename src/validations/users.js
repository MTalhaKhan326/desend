const Joi = require('joi');

exports.phoneLogin = (login) => {

    const loginSchema = Joi.object
        ({
            phone: Joi.string().required().min(1),
            password: Joi.string().required().min(1),
            fcmToken: Joi.string()
        })

    return result = loginSchema.validate(login);

}

exports.emailLogin = (login) => {

    const loginSchema = Joi.object
        ({
            email: Joi.string().required().min(1),
            password: Joi.string().required().min(1),
        })

    return result = loginSchema.validate(login);

}

exports.resetPassword = (req) => {

    const passwordSchema = Joi.object
        ({
            phone: Joi.string().required().min(1),
            password: Joi.string().required().min(1),
            newPassword: Joi.string().required().min(1),
        })

    return result = passwordSchema.validate(req);

}

exports.syncContact = (req) => {

    const passwordSchema = Joi.object
        ({
            contacts: Joi.array().required().min(1),
        });

    return result = passwordSchema.validate(req);

}

