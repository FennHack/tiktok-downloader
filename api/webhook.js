require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');

module.exports.config = {
    api: {
        bodyParser: true,
    },
};

const bot = new Telegraf(process.env.BOT_TOKEN);

// =====================================
// TikTok Fetch
// =====================================

async function getTikTokData(url) {

    try {

        const api =
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

        const response = await axios.get(api, {
            timeout: 30000
        });

        if (
            !response.data ||
            !response.data.data
        ) {
            return null;
        }

        return response.data.data;

    } catch (err) {

        console.log('TIKTOK API ERROR:', err.message);

        return null;
    }
}

// =====================================
// Start
// =====================================

bot.start(async (ctx) => {

    await ctx.telegram.sendMessage(
        ctx.chat.id,
        `TikTok Downloader\n\n` +
        `Support:\n` +
        `- Video\n` +
        `- Slide\n` +
        `- Story\n\n` +
        `Owner: @wrrar`
    );

});

// =====================================
// Main Handler
// =====================================

bot.on('text', async (ctx) => {

    try {

        const text = ctx.message.text;

        // =========================
        // Validasi Link
        // =========================

        if (!text.includes('tiktok.com')) {

            return await ctx.telegram.sendMessage(
                ctx.chat.id,
                'Link TikTok tidak valid'
            );

        }

        await ctx.telegram.sendMessage(
            ctx.chat.id,
            'Processing...'
        );

        // =========================
        // Fetch API
        // =========================

        const result = await getTikTokData(text);

        // Crosscheck 1
        if (!result) {

            return await ctx.telegram.sendMessage(
                ctx.chat.id,
                'Gagal mengambil data TikTok'
            );

        }

        // Crosscheck 2
        if (
            !result.play &&
            !result.images &&
            !result.wmplay &&
            !result.hdplay
        ) {

            return await ctx.telegram.sendMessage(
                ctx.chat.id,
                'Media tidak ditemukan'
            );

        }

        // =================================
        // SLIDE
        // =================================

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
                            ? `${result.title || 'TikTok Slide'}\n\nOwner: @wrrar`
                            : undefined

                }));

            await ctx.telegram.sendMediaGroup(
                ctx.chat.id,
                media
            );

            return;
        }

        // =================================
        // VIDEO / STORY
        // =================================

        const videoUrl =
            result.play ||
            result.hdplay ||
            result.wmplay;

        if (videoUrl) {

            await ctx.telegram.sendVideo(
                ctx.chat.id,
                {
                    url: videoUrl
                },
                {
                    caption:
                        `${result.title || 'TikTok Video'}\n\n` +
                        `Owner: @wrrar`
                }
            );

            return;
        }

        // =================================
        // Fallback
        // =================================

        return await ctx.telegram.sendMessage(
            ctx.chat.id,
            'Format media tidak didukung'
        );

    } catch (err) {

        console.log('BOT ERROR:', err);

        return await ctx.telegram.sendMessage(
            ctx.chat.id,
            'Terjadi error server'
        );
    }

});

// =====================================
// Webhook
// =====================================

module.exports = async (req, res) => {

    if (req.method === 'GET') {

        return res
            .status(200)
            .send('Bot Active');

    }

    if (req.method !== 'POST') {

        return res
            .status(405)
            .send('Method Not Allowed');

    }

    try {

        if (!req.body) {

            return res
                .status(400)
                .send('No Body');

        }

        await bot.handleUpdate(req.body);

        return res
            .status(200)
            .send('OK');

    } catch (err) {

        console.log('WEBHOOK ERROR:', err);

        return res
            .status(500)
            .send('Internal Server Error');
    }

};
