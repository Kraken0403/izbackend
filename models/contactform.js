const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const contactSchema = new Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

const Contact = model('Contact', contactSchema);
module.exports = Contact