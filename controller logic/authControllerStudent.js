const { studentModel } = require("../Models/studentmodule.js");
const asyncHandler = require("express-async-handler");

exports.checkStudent = asyncHandler(async (req, res) => {
  const { userType, email, password } = req.body;

  const student = await studentModel.findOne({ email });

  if (!student) {
    return res.status(400).render("Signin.ejs", {
      error: "your mail not in our system",
    });
  }

  if (student.password !== password) {
    return res.status(400).render("Signin.ejs", {
      error: "Wrong Password",
    });
  }
  /* req.session.service = doctor.service --> to extract the data and send it to body**/

  req.session.studentId = student._id;
  res.redirect("/profile");
});
