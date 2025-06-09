const express = require("express");
const { spawn } = require("child_process");
const session = require("express-session");
const process = require("process");
const dbConnection = require("./Config/db.js");
const authorContraller = require("./controller logic/authController.js");
const studentRouts = require("./Routs/studentRouts.js");
const nodemailer = require("nodemailer");
const multer = require("multer");

// mail sender

//

const app = express();
const port = 3000;

dbConnection();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "first-session-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.static("public"));

app.use("/addtosystem", studentRouts);

app.post("/start-recording", attendSheet);
function attendSheet(req, res) {
  const process = spawn("python", ["./Ai module/model/model.py"]);
  let output = "";

  const timeout = setTimeout(() => {
    process.kill();
    console.error("process stop ");
    res.status(504).send("process timeout");
  }, 20000);

  process.stdout.on("data", (data) => {
    output += data.toString();
  });

  process.stderr.on("data", (data) => {
    console.error("Error:", data.toString());
  });

  process.on("close", () => {
    // Example: send data or redirect
    // res.send(output); // Send result to frontend
    clearTimeout(timeout);
    console.log(output);
    if (output) {
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "hassan.mohamed297200@gmail.com",
          pass: "inla mugf nfsj ctwq",
        },
      });
      var mailOptions = {
        from: "hassan.mohamed297200@gmail.com",
        to: "hassan.mohamed297200@gmail.com",
        subject: "Attend report",
        text: output,
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } else {
      console.error("No output");
    }
  });
  console.log(output);
}

app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("index.ejs");
  console.log(process.cwd());
});

app.post("/signin", authorContraller.checkuser);
app.get("/signin", (req, res) => {
  res.render("Signin.ejs");
});

app.get("/profile", (req, res) => {
  if (!req.session.doctorId) {
    return res.redirect("/signin");
  }

  let name;
  if (req.session.userType === "student") {
    name = req.session.studentname;
  } else if (req.session.userType === "teacher") {
    name = req.session.doctorName;
  }

  res.render("profile.ejs", { name: name });
});

app.get("/uploadvideo", (req, res) => {
  if (!req.session.doctorId) {
    return res.redirect("/signin");
  }

  let name;
  if (req.session.userType === "student") {
    name = req.session.studentname;
  } else if (req.session.userType === "teacher") {
    name = req.session.doctorName;
  }

  res.render("uploadvideo.ejs", { result: "" });
});

app.get("/Doctorprofile", (req, res) => {
  if (!req.session.doctorId) {
    return res.redirect("/signin");
  }
  let name = req.session.doctorName;
  res.render("teacherIntro.ejs", { name: name });
});
app.get("/record", (req, res) => {
  if (!req.session.doctorId) {
    return res.redirect("/signin");
  }
  let name = req.session.doctorName;
  res.render("record.ejs", { name: name });
});

// Train _ video action="/upload" method="POST" enctype="multipart/form-data"

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const py = spawn("python", [
    "D:/Graduation project/Attendace system Wesite/Ai module/Evaluate Videos/video_chech_V2.py",
  ]);

  py.stdin.write(req.file.buffer);
  py.stdin.end();

  let results = "";

  py.stdout.on("data", (data) => {
    results += data.toString(); // accumulate output
  });

  py.stderr.on("data", (err) => {
    console.error(`Python error: ${err}`);
  });

  py.on("close", (code) => {
    if (code === 0) {
      // Python finished successfully, render EJS with results
      res.render("uploadvideo.ejs", { result: results });
    } else {
      res.status(500).send("Python script failed.");
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
