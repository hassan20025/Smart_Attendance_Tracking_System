const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose
    .connect(
      "mongodb+srv://Hassan:hassan@cluster0.9mnhr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    .then((conn) => {
      console.log("database is connected ... ");
    })
    .catch((err) => {
      console.log("database Can't connected ..");
    });
};

module.exports = dbConnection;
