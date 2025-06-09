const mongoose = require("mongoose");

const student = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: [5, "student name is very short name"],
      maxlength: [100, "student name is very long name"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    id: {
      type: Number,
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

const studentModel = mongoose.model("Student", student);
module.exports = { studentModel };
