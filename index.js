import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import QrCode from "qrcode-reader";
import Jimp from "jimp";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const app = express();
const __dirname = path.dirname(__filename);
const qr = new QrCode();
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  attendance: Number,
});

const User = mongoose.model("User", UserSchema);

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

qr.callback = function (error, result) {
  if (error) {
    console.log(error);
    return;
  }
  console.log(result);
};

const handleError = (err, res) => {
  res.status(500).contentType("text/plain").end("Oops! Something went wrong!");
};

const upload = multer({
  dest: "/tmp",
});

const readQRCode = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const img = await Jimp.read(fs.readFileSync(filePath));
      const qr = new QrCode();
      const value = await new Promise((resolve, reject) => {
        qr.callback = (err, v) => (err != null ? reject(err) : resolve(v));
        qr.decode(img.bitmap);
      });
      return value.result;
    }
  } catch (error) {
    return error.message;
  }
};

const createTempPath = async (req) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, "/uploads/image.jpg");

  fs.rename(tempPath, targetPath, (err) => {
    if (err) return handleError(err, res);
  });
};

app.get("/", express.static(path.join(__dirname, "./public")));

app.post("/", upload.single("file"), async (req, res) => {
  await createTempPath(req);
  const data = await readQRCode("./uploads/image.jpg");
  const updated = await User.findOneAndUpdate(
    { name: data },
    {
      $inc: { attendance: 1 },
    },
    { new: true }
  );
  console.log(updated);

  res.status(200).contentType("text/plain").end(data);
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
