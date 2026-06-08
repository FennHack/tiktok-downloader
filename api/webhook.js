require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

async function getTikTokData(url) {
    try {
        const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

        const res = await axios.get(api);

        return res.data.data;
    } catch (e) {
        console.log(e);
        return null;
    }
}

bot.start(async (ctx) => {
    await ctx.reply(
        'Kirim link TikTok video / slide / story'
    );
});

bot.on('text', async (ctx) => {

    const text = ctx.message.text;

    if (!text.includes('tiktok.com')) {
        return ctx.reply('Itu bukan link TikTok 🗿');
    }

    const wait = await ctx.reply('Downloading...');

    try {

        const data = await getTikTokData(text);

        if (!data) {
            return ctx.reply('Gagal ambil data');
        }

        // slideshow
        if (data.images && data.images.length > 0) {

            const media = data.images.map((img, i) => ({
                type: 'photo',
                media: img,
                caption: i === 0 ? (data.title || 'TikTok Slide') : undefined
            }));

            await ctx.replyMediaGroup(media);

        } else {

            await ctx.replyVideo(
                { url: data.play },
                {
                    caption:
                        `🎬 ${data.title || 'TikTok Video'}\n` +
                        `👤 ${data.author?.nickname || '-'}`
                }
            );
        }

        await ctx.deleteMessage(wait.message_id);

    } catch (err) {
        console.log(err);
        await ctx.reply('Error');
    }
});

module.exports = async (req, res) => {

    try {

        await bot.handleUpdate(req.body);

        res.status(200).send('ok');

    } catch (err) {

        console.log(err);

        res.status(500).send('error');
    }
};
