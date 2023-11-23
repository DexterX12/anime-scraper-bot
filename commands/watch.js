const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require('discord.js');
const {getEpisodeFromURL, requestDownloadURL, getAnimesURL, getAnimeEpisode} = require('../scrapers/scraper.js');
const {downloadAnimeFile} = require('../scrapers/general.js');
const {searchAnimeJK, requestDownloadURLJK, getEpisodeJK} = require('../scrapers/scraperJK.js');

function populateSeries (seriesList) {
    const options = [];
    let index = 0;
    for (const series of seriesList) {
        options.push(
            new StringSelectMenuOptionBuilder()
            .setLabel(series.title)
            .setDescription(`Year: ${series.year}. Type ${series.type}`)
            .setValue(`${index}`)
        );

        index += 1;
    }

    const select = new StringSelectMenuBuilder()
                   .setCustomId('series')
                   .setPlaceholder('Select a series')
                   .addOptions(...options);

    return select;
}

async function getSeries (interaction) {
    const spanish = interaction.options.getBoolean('spanish');
    let series = [];
    
    if (spanish)
        series = await searchAnimeJK(interaction.options.getString('title'));
    else
        series = await getAnimesURL(interaction.options.getString('title'));

    if (!series) {
        interaction.editReply("Error. The server has retrieved 0 results.");
        return;
    }

    // Creating the components of the Discord message with the select menu and cancel button
    const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(populateSeries(series));
    const row2 = new ActionRowBuilder().addComponents(cancel);

    // Sends and retrieves the message with the menu, for to wait the selection
    const message = await interaction.editReply({components: [row, row2], content: "Hi there"}).catch( error => console.log(error));

    await sendSeries(interaction, message, series); // Episodes retrieve successfully!
}

async function getAnimePahe (animeInfo, isHD, message) {
    const animeEpisodeURL = await getAnimeEpisode(animeInfo.animeID, animeInfo.episode);
    const downloadURL = await getEpisodeFromURL(animeEpisodeURL, isHD);
    const videoRequestURL = await requestDownloadURL(downloadURL)
    const generatedTitle = await downloadAnimeFile(videoRequestURL, animeInfo, message);

    return generatedTitle;
}

async function getAnimeJK (animeInfo, message) {
    const episodeURL = await getEpisodeJK(animeInfo);
    const videoRequestURL = await requestDownloadURLJK(episodeURL);
    const generatedTitle = await downloadAnimeFile(videoRequestURL, animeInfo, message);

    return generatedTitle;
}

async function sendSeries (interaction, message, series) {
    const collectorFilter = i => i.user.id == interaction.user.id;
    const episodeNumber = interaction.options.getNumber('episode');
    const isHD = interaction.options.getBoolean('hd');
    const spanish = interaction.options.getBoolean('spanish');

    try {
        // Wait for the user to select the series
        const confirmation = await message.awaitMessageComponent({filter: collectorFilter, time: 30000})
        
        if (confirmation.customId === 'cancel') {
            await message.delete().catch( error => console.log(error));
            return;
        }

        await confirmation.deferReply().catch( error => console.log(error));;

        try {
            const animeInfo = {
                title: series[parseInt(confirmation.values[0])].title,
                animeID: (spanish) ? series[parseInt(confirmation.values[0])].id : series[parseInt(confirmation.values[0])].session,
                episode: episodeNumber,
                slug: (spanish) ? series[parseInt(confirmation.values[0])].slug : null
            };

            let generatedTitle = null;

            if (spanish) {
                generatedTitle = await getAnimeJK(animeInfo, confirmation)
            } else
                generatedTitle = await getAnimePahe(animeInfo, isHD, confirmation);

            await confirmation.editReply(`https://yoursecuredomain.com/${generatedTitle}`).catch(error => console.log(error));
            await message.delete().catch(error => console.log(error));

        } catch (error) {
            console.log(error);
            await message.channel.send(`There's been an error retrieving the episode. Please, try again later.`).catch( er => console.log(er));
        }

    } catch (error) {
        await message.delete().catch( error => console.log(error));
    }
}



module.exports = {
    data: new SlashCommandBuilder()
        .setName('watch')
        .setDescription('Retrieve a viewable episode')
        .addStringOption(option =>
            option
                .setName('title')
                .setRequired(true)
                .setDescription('The title of the series'))
        .addNumberOption(option =>
            option
                .setName('episode')
                .setRequired(true)
                .setDescription('The number of the episode'))
        .addBooleanOption(option => 
            option
                .setName('spanish')
                .setRequired(true)
                .setDescription('Wether the episode is retrieved in spanish or not')
        )
        .addBooleanOption(option =>
            option
                .setName('hd')
                .setRequired(true)
                .setDescription('Retrieve HD of the episode if available')),

    async execute(interaction) {
        await interaction.deferReply();
        await getSeries(interaction);
    }
}