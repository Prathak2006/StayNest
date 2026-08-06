const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().min(5).max(100).required(),
        description: Joi.string().min(5).max(1000).required(),
        location: Joi.string().min(5).max(100).required(),
        country: Joi.string().min(5).max(100).required(),
        image: Joi.string().allow("", null),
        price: Joi.number().required().min(0),
        category: Joi.string().required(),
    }).required(),
    
});



module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required()
});

