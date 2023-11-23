const express = require('express');
const app = express();
const PORT = 443;
const https = require('https');
const fs = require('fs');
const baseURL = "https://yoursecuredomain.com/";

app.use(express.static(__dirname + '/public'));

app.get("/", async (req, res) => {
    res.send("Nothing to see here");
})

// In order for discord to load your video, your website needs to have a SSL certificate
// You can get a free one at https://zerossl.com/
const options = {
key: fs.readFileSync("./ssl/private.key"),
cert: fs.readFileSync("./ssl/certificate.crt"),
ca: fs.readFileSync("./ssl/ca_bundle.crt")
};

https.createServer(options, app).listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
});

app.get(/^\/[a-z0-9]+$/, async (req, res) => {
    try {
        const relativePath = `${baseURL}${req.path.substring(1)}.mp4`;
        const title = fs.readFileSync(`./public/${req.path.substring(1)}.txt`);
        res.send(`
          <html>
          <meta property="og:site_name" content="Anime Viewer">
          <meta property="og:url" content="${baseURL}">
          <meta property="og:type" content="video.other">
          <meta property="og:title" content="${title}">
          <meta property="og:image" content="https://images.pexels.com/videos/3045163/free-video-3045163.jpg">
          <meta property="og:video" content="${relativePath}">
          <meta property="og:video:type" content="video/mp4">
          <meta property="og:video:secure_url" content="${relativePath}">
          <meta property="og:video:height" content="720">
          <meta property="og:video:width" content="1280">
          <meta property="og:image:height" content="720">
          <meta property="og:image:width" content="1280">
          </html>
        `);
    } catch (error) {
        console.error(error);
        res.send(`<p>NOT FOUND :(</p>`);
    }
});