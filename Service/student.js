const { studentModel } = require("../Models/studentmodule");
const asyncHandler = require("express-async-handler");

exports.addNewStudent = asyncHandler(async (req, res) => {
  const { name, email, id, password } = req.body;
  const newStudent = await studentModel.create({ name, email, id, password });
  res.status(201).json({ data: newStudent });
});
