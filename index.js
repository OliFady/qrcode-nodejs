import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const Schema = mongoose.Schema;
const urlencodedParser = bodyParser.text({ type: "*/*" });

const UserSchema = new Schema({
  name: String,
  attendance: Number,
});

const User = mongoose.model("User", UserSchema);

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api", async (req, res) => {
  res.send("API is working");
});

app.post("/api", urlencodedParser, async (req, res) => {
  console.log(req.body);

  const data = req.body;
  const updated = await User.findOneAndUpdate(
    { name: data },
    {
      $inc: { attendance: 1 },
      $set: { attended_at: Date.now() },
    },
    { new: true }
  );
  console.log(updated);

  res.status(200).contentType("text/plain").end(data);
});

app.post("/addscouts", bodyParser.json(), async (req, res) => {
  console.log(req.body);

  const data = req.body;
  const updated = await User.create({
    name: data.name,
    grade: data.grade,
    birthdate: data.birthdate,
    phone: data.phone,
    fatherphone: data.fatherphone,
    motherphone: data.motherphone,
  });
  console.log(updated);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify(data));
  res.end();
});

app.listen(8080, () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

  console.log("Listening on port 8080");
});
