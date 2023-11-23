# Anime Scraping Bot

Bot that searches the web for anime content in order to watch it.

### How does it work?

It scrapes pages like AnimePahe and JKanime for english and spanish episodes respectively. It downloads episodes to the bot host machine and creates a dynamic URL that users can access to watch the requested episode.

![](https://i.imgur.com/XfsFz3v.gif)

### Before you begin

1. The bot relies on having a local web-server to serve the videos, so it's necessary public access in order for Discord to access them.
2. Discord only creates video embeds when the URL is being secured by SSL. The web-server needs a SSL certificate for Discord to be able to show the video.

### Setup

This quick-guide assumes you already have knowledge on how to create and set a basic Discord bot. If not, please check https://discordjs.guide/

1. Clone this repository
2. Put your bot token and client ID in `config.json`
3. Create the `public` directory (Where the videos will be stored)
4. Create the `ssl` directory (Where SSL certificates will be stored)
5. Both `app.js` and `./commands/watch.js` have a placeholder for the server's URL. Change it for whatever you'd want.
6. After putting your bot's token and client ID, run `register.js` once for registering the commands into your bot.
7. Start `web.js` and `bot.js`
8. Done.

### Possible issues

Webpages may protect themselves with services like Cloudflare. Although this bot uses some libraries to avoid being detected as non-human interaction, it's not perfect and may induce some errors. Please keep this in mind.


## Legal

⚠️ This project has been made for educational purposes only. You are responsible for any possible TOS breaking using this.
