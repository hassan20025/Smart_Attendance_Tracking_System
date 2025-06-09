const mongoose = require("mongoose");

const doctorModule = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: [10, "Doctor name is very short name"],
      maxlength: [100, "Doctor name is very long name"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      match: /^[A-Za-z0-9]+$/, // only letters and numbers
    },
  },
  { timestamps: true }
);

const doctorModel = mongoose.model("Doctors", doctorModule);
module.exports = { doctorModel };
