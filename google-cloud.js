const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/public/index.html"));
});

const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 1048576, // 1MB, configure based on the requirement
        files: 1,
    },

    // only allows image files with .jpg or .jpeg extensions
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg)$/)) {
            let a = document.getElementsByClassName("error-msg");
            console.log(a);
        }
        cb(null, true);
    },
});

const storage = new Storage({
    projectId: "xxxxxxxxxxx",
    keyFilename: "path/to/keyfile.json",
});

/* Reference to an existing bucket */
const bucket = storage.bucket("your-bucket-name");

app.post("/uploads", upload.single("image"), (req, res) => {
    /* to store images in GCS */

    // Upload a file to the bucket
    bucket.upload(
        "/path/to/file.txt",
        {
            gzip: true,
            metadata: {
                cacheControl: "public, max-age=31536000",
            },
        },
        (err, file) => {
            if (err) {
                res.status(500).send({ error: err });
                return;
            }
            res.send({ message: "File uploaded to Google Cloud Storage" });
        }
    );
});

app.listen(3000, () => console.log("Application listening on port 3000! " + "http://localhost:3000/"));

const storage = require("@google-cloud/storage");
const client = new storage.Storage();

app.get("/bucket-contents", (req, res) => {
    // /bucket-contents is the URL
    const bucket = client.bucket(BUCKET_NAME);

    bucket.getFiles((err, files) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            const fileDetails = files.map((file) => {
                return {
                    name: file.name,
                    url: `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`,
                };
            });
            res.render("google-data-bucket", { fileDetails }); // google-data-bucket is the file name
        }
    });
});

app.get("/download/:file", async (req, res) => {
    // Get the requested image from the bucket
    const file = bucket.file(req.params.filename);
    const [data] = file.createReadStream();
    res.download(data, data.replace("myjpeg", "jpeg"), (err) => {
        if (err) {
            return err;
        } else {
            console.log(`File "${file}" downloaded successfully`);
        }
    });

    // Serve the image to the client
    res.set("Content-Type", "image/jpeg");
    data.pipe(res);
});
