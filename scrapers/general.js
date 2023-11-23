const https = require('https');
const fs = require('fs');

async function programDeletion (fileName, time) {
    setTimeout(() => {
        fs.unlink("./public/" + fileName, err => {
            if (err) {
                throw err;
            }
    
            console.log(`${fileName} deleted after ${time / 60000} minutes.`);
        })
    }, time);
}

async function downloadAnimeFile (url, animeInfo, progressMessage) {
    return new Promise((resolve, reject) => {
        https.get(url, async httpRes => {
            const generatedTitle = (Math.random() + 1).toString(36).substring(4);
            const path = `./public/${generatedTitle}.mp4`;
            const writeStream = fs.createWriteStream(path);
    
            const fileSize = parseInt(httpRes.headers['content-length'], 10);
            let interval = null;
            
            // Prepare the deletion of the files after N minutes after they've been downloaded
            writeStream.on("finish", () => {
                clearInterval(interval);
                writeStream.close();
    
                // Creates a TXT with the title of the anime corresponding to the current download
                fs.writeFileSync(`./public/${generatedTitle}.txt`, `${animeInfo.title} Episode ${animeInfo.episode}`);
    
                programDeletion(generatedTitle + ".mp4", 60 * 60000);
                programDeletion(generatedTitle + ".txt", 60 * 60000);
    
                resolve(generatedTitle);
            });
    
            // Refreshes the download progress every N seconds
            interval = setInterval( async () => {
                const percentage = parseInt((writeStream.bytesWritten * 100) / fileSize);
    
                try {
                    await progressMessage.editReply(`
                    Total length of the requested episode: ${parseInt(fileSize / Math.pow(10, 6))} MB.
                    Current progress: ${percentage}%`); 
                } catch (error) {
                    reject("An error has ocurred. Probably the message has been deleted. Deleting download...")
                    writeStream.close();
                    programDeletion(generatedTitle + ".mp4", 5000);
                    programDeletion(generatedTitle + ".txt", 5000);
                }
                
            }, 5 * 1000);
    
            httpRes.pipe(writeStream);
        });

    })
}

module.exports = {
    downloadAnimeFile
};