require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');

module.exports.config = {
    api: {
        bodyParser: true,
    },
};

const bot = new Telegraf(process.env.BOT_TOKEN);

// ======================
// Ambil data TikTok
// ======================

async function getTikTok(url) {

    try {

        const api =
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

        const { data } = await axios.get(api);

        if (!data || !data.data) {
            return null;
        }

        return data.data;

    } catch (err) {

        console.log('API ERROR:', err.message);

        return null;
    }
}

// ======================
// START
// ======================

bot.start(async (ctx) => {

    await ctx.reply(
        `TikTok Downloader Bot\n\n` +
        `Support:\n` +
        `• Video\n` +
        `• Slideshow\n` +
        `• Story\n` +
        `• Owner @wrrar`
    );

});

// ======================
// HANDLE TEXT
// ======================

bot.on('text', async (ctx) => {

    try {

        const text = ctx.message.text;

        if (!text.includes('tiktok.com')) {
            return ctx.reply(' Link TikTok not valid');
        }

        await ctx.reply('Downloading...');

        const result = await getTikTok(text);

        if (!result) {
            return ctx.reply('Gagal mengambil data');
        }

        // ======================
        // SLIDESHOW
        // ======================

        if (
            Array.isArray(result.images) &&
            result.images.length > 0
        ) {

            const media = result.images
                .slice(0, 10)
                .map((img, index) => ({
                    type: 'photo',
                    media: img,
                    caption:
                        index === 0
                            ? ` ${result.title || 'TikTok Slide'}`
                            : undefined
                }));

            await ctx.telegram.sendMediaGroup(
                ctx.chat.id,
                media
            );

            return;
        }

        // ======================
        // VIDEO / STORY
        // ======================

        const videoUrl =
            result.play ||
            result.wmplay ||
            result.hdplay;

        if (videoUrl) {

            await ctx.replyVideo(
                { url: videoUrl },
                {
                    caption:
                        ` ${result.title || 'TikTok Video'}`
                }
            );

            return;
        }

        // ======================
        // FALLBACK
        // ======================

        return ctx.reply(
            ' Media tidak ditemukan'
        );

    } catch (err) {

        console.log('BOT ERROR:', err);

        return ctx.reply(
            ' Terjadi error server'
        );
    }

});

// ======================
// WEBHOOK
// ======================

module.exports = async (req, res) => {

    if (req.method === 'GET') {
        return res
            .status(200)
            .send('Bot aktif 🚀');
    }

    try {

        await bot.handleUpdate(req.body);

        return res
            .status(200)
            .send('OK');

    } catch (err) {

        console.log('WEBHOOK ERROR:', err);

        return res
            .status(500)
            .send('ERROR');
    }
};
