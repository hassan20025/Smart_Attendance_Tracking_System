const { addNewStudent } = require("../Service/student");
const express = require("express");

const router = express.Router();

router.post("/", addNewStudent);

module.exports = router;
