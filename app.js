const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

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
});

app.post("/uploads", upload.single("image"), (req, res) => {
    /* to store images in local directory */
    const filePath = path.join(__dirname + "/public/uploads");
    const directory = path.dirname(filePath);

    fs.access(directory, fs.constants.W_OK, (err) => {
        if (err) {
            console.error(`${directory} is not writable`);
        } else {
            // Write the file using Sharp toFile() method
            sharp(req.file.path)
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile("uploads/" + req.file.originalname.replace(/\.jpeg|\.jpg/gi, ".myjpeg"))
                .then((imgInfo) => {
                    // image has been processed and saved as a JPEG file
                    console.log("image stored at", imgInfo, filePath + "/" + req.file.originalname);

                    fs.readdir("uploads/", (err, files) => {
                        files.filter((file) => {
                            if (!file.endsWith(".myjpeg")) {
                                console.log(__dirname + `/uploads/${file}`);
                                fs.unlink(__dirname + `/uploads/${file}`, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                        });
                    });
                })
                .catch((err) => {
                    return err;
                });
        }
    });
});

app.listen(3000, () => console.log("Application listening on port 3000! " + "http://localhost:3000/"));

app.get("/view-images", (req, res) => {
    fs.readdir("uploads/", (err, files) => {
        if (err) {
            res.sendStatus(500);
            return err;
        } else {
            let myjpegFiles = files.filter((file) => file.endsWith(".myjpeg"));
            res.render("view", { myjpegFiles: myjpegFiles });
        }
    });
});

app.get("/download/:file", (req, res) => {
    const file = req.params.file;
    const filePath = `./uploads/${file}`;
    res.download(filePath, filePath.replace("myjpeg", "jpeg"), (err) => {
        if (err) {
            return err;
        } else {
            console.log(`File "${file}" downloaded successfully`);
        }
    });
});
