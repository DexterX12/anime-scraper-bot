const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ADblock = require('puppeteer-extra-plugin-adblocker');
const baseURL = "https://jkanime.net";

puppeteer.use(StealthPlugin());
puppeteer.use(ADblock());

async function searchAnimeJK (animeTitle) {
    const response = await fetch(`https://jkanime.net/ajax/ajax_search/?q=${animeTitle}`);
    const animes = (await response.json()).animes;

    return animes;
}

async function getEpisodeJK (animeInfo) {
    const response = await fetch(`https://jkanime.net/ajax/pagination_episodes/${animeInfo.animeID}/${Math.ceil(animeInfo.episode/12)}/`)
    const episodes = await response.json();
    let url = null;

    for (const episode of episodes) {
        if (parseInt(episode.number) == animeInfo.episode) {
            url = `${baseURL}/${animeInfo.slug}/${animeInfo.episode}`;
        }
    }

    return url;
}

async function requestDownloadURLJK (episodeURL) {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    await page.goto(episodeURL, {waitUntil: "networkidle2"});

    return new Promise(async (resolve, reject) => {
        page.on("request", async request => {
            if (!request.url().includes(".mp4"))
                return;
            
            await browser.close();
            resolve(request.url());
        });
    
        await page.waitForSelector("#dwld");
        await page.click("#dwld");
        await page.waitForSelector("#simplemodal-container");
        await page.waitForSelector("#jkdown");
        await page.click("#jkdown");
    })
}

module.exports = {
    searchAnimeJK,
    requestDownloadURLJK,
    getEpisodeJK
}