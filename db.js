const mongoURL = process.env.mongoURL;
const mongoose = require("mongoose");

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectToDB = async () => {
  try {
    await mongoose.connect(mongoURL, connectionParams);
    console.log("Connected To Database");
  } catch (err) {
    console.error(`Error connecting to the database. \n${err}`);
  }
};

module.exports = connectToDB;
