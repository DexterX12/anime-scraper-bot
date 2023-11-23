const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ADblock = require('puppeteer-extra-plugin-adblocker');
const jsdom = require('jsdom');
const baseURL = "https://animepahe.ru";

puppeteer.use(StealthPlugin());
puppeteer.use(ADblock());

async function getDOMifiedPage (pageLink, waitFor=false) {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    const response = await page.goto(pageLink, {waitUntil: "networkidle2"});
    let body = null;

    // Some things load after the page is main-loaded, so wait for that to appear
    if (waitFor) {
        body = await waitFor(page);
    } else
        body = await response.text();

    await browser.close();

    const dom = new jsdom.JSDOM(body).window.document;

    return dom;
}


async function requestDownloadURL (mainURL) {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    await page.goto(mainURL, {waitUntil: "networkidle2"});

    return new Promise(async (resolve, reject) => {
        page.on("request", async request => {
            const url = request.url();
            if (!url.includes(".mp4"))
                return;

            await browser.close();
            resolve(url);
        });

        await page.click('button[type="submit"]');
    });
}

async function getEpisodeFromURL (episodeURL, hdPreferred) {
    let dom = await getDOMifiedPage(episodeURL);

    const downloadMenu = dom.querySelector('div#pickDownload');
    const downloadLinks = downloadMenu.querySelectorAll("a");
    let dlink = null;

    // If user prefers in HD, search for it
    if (hdPreferred && downloadLinks.length > 1) {
        for (const link of downloadLinks) {
            const textContent = link.innerHTML;

            if (textContent.includes("720p") && !textContent.includes('<span class="badge badge-warning text-capitalize">eng</span>')) {
                dlink = link.href;
                break;
            }
        }

        // What if 720p is not available?
        if (!dlink)
            dlink = downloadLinks[0].href; // Get the first quality is available

    } else
        dlink = downloadLinks[0].href;
    

    dom = await getDOMifiedPage(dlink, async (page) => {
        await page.waitForFunction('document.querySelector("a.redirect").textContent == "Continue"');
        const bodyElement = await page.$('body');
        return await bodyElement.evaluate(x => x.innerHTML);
    });

    return dom.querySelector('a.redirect').href;

}

async function getAnimeEpisode (animeID, episodeNumber) {
    // Each page has 30 episodes, so every 30 episodes the number of pages increases by 1
    const response = await fetch(`https://animepahe.ru/api?m=release&id=${animeID}&sort=episode_asc&page=${Math.ceil(episodeNumber/30)}`);

    try {
        const episode = `${baseURL}/play/${animeID}/${(await response.json()).data[episodeNumber - 1].session}`;
        return episode;

    } catch (e) {
        console.error(e)
        return null;
    } 
}

async function getAnimesURL (animeTitle) {
    try {
    const response = await fetch(`https://animepahe.ru/api?m=search&q=${animeTitle}`, {credentials: 'include'});
	const animes = (await response.json()).data;
    return animes;
    
    } catch (e) {
        console.error(e);
    }
}

module.exports = {
    getAnimesURL,
    getAnimeEpisode,
    getEpisodeFromURL,
    requestDownloadURL
};
