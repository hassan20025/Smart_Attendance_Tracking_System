const { doctorModel } = require("../Models/doctormodule.js");
const asyncHandler = require("express-async-handler");

exports.checkDoctor = asyncHandler(async (req, res) => {
  const { userType, email, password } = req.body;

  const doctor = await doctorModel.findOne({ email });
  const name = doctor.name;
  if (!doctor) {
    return res.status(400).render("Signin.ejs", {
      error: "your mail not in our system",
    });
  }

  if (doctor.password !== password) {
    return res.status(400).render("Signin.ejs", {
      error: "Wrong Password",
    });
  }
  /* req.session.service = doctor.service --> to extract the data and send it to body**/
  req.session.doctorName = doctor.name;
  req.session.doctorId = doctor._id;
  res.redirect("/profile");
});
