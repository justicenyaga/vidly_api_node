const Joi = require("joi");

module.exports = function () {
  require("express-async-errors");
  Joi.objectId = require("joi-objectid")(Joi);
};
