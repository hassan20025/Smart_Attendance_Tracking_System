const { doctorModel } = require("../Models/doctormodule.js");
const { studentModel } = require("../Models/studentmodule.js");
const asyncHandler = require("express-async-handler");

const checkuser = asyncHandler(async (req, res) => {
  const { userType, email, password } = req.body;

  if (userType === "teacher") {
    const doctor = await doctorModel.findOne({ email });

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
    req.session.userType = userType;
    return res.redirect("/Doctorprofile");
  } else if (userType === "student") {
    const student = await studentModel.findOne({ email });

    if (!student) {
      return res.status(400).render("Signin.ejs", {
        error: "This mail is not in our systemm",
      });
    }

    if (student.password !== password) {
      return res.status(400).render("Signin.ejs", {
        error: "Wrong Password",
      });
    }
    req.session.studentname = student.name;
    req.session.studentId = student._id;
    req.session.userType = userType;
    return res.redirect("/profile");
  } else {
    res.status(400).render("signin.ejs", { error: "no choose of user Type" });
  }
});

module.exports = { checkuser };
