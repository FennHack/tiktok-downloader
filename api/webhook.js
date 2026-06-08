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
// Fetch TikTok Data
// =====================================

async function getTikTokData(url) {

    try {

        const api =
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

        const response = await axios.get(api, {
            timeout: 30000
        });

        // Crosscheck 1
        if (!response.data) {
            return null;
        }

        // Crosscheck 2
        if (!response.data.data) {
            return null;
        }

        return response.data.data;

    } catch (err) {

        console.log('API ERROR:', err.message);

        return null;
    }
}

// =====================================
// Start Command
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

        // ============================
        // Validate URL
        // ============================

        if (
            !text.includes('tiktok.com')
        ) {

            return await ctx.telegram.sendMessage(
                ctx.chat.id,
                'Link TikTok tidak valid'
            );

        }

        await ctx.telegram.sendMessage(
            ctx.chat.id,
            'Processing...'
        );

        // ============================
        // Get Data
        // ============================

        const result = await getTikTokData(text);

        // Crosscheck
        if (!result) {

            return await ctx.telegram.sendMessage(
                ctx.chat.id,
                'Gagal mengambil data'
            );

        }

        // =========================================
        // SLIDE
        // =========================================

        if (
            Array.isArray(result.images) &&
            result.images.length > 0
        ) {

            try {

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

            } catch (slideErr) {

                console.log('SLIDE ERROR:', slideErr);

                return await ctx.telegram.sendMessage(
                    ctx.chat.id,
                    'Gagal mengirim slide'
                );
            }
        }

        // =========================================
        // VIDEO / STORY
        // =========================================

        const videoUrl =
            result.hdplay ||
            result.play ||
            result.wmplay;

        // Crosscheck video
        if (!videoUrl) {

            return await ctx.telegram.sendMessage(
                ctx.chat.id,
                'Video tidak ditemukan'
            );

        }

        // =========================================
        // SEND VIDEO PREVIEW
        // =========================================

        try {

            await ctx.telegram.sendVideo(
                ctx.chat.id,
                {
                    url: videoUrl
                },
                {
                    caption:
                        `${result.title || 'TikTok Video'}\n\n` +
                        `Owner: @wrrar`,

                    supports_streaming: true
                }
            );

        } catch (videoErr) {

            console.log('VIDEO ERROR:', videoErr);

            await ctx.telegram.sendMessage(
                ctx.chat.id,
                'Gagal mengirim preview video'
            );
        }

        // =========================================
        // SEND FULL QUALITY DOCUMENT
        // =========================================

        try {

const title =
    (result.title || 'TikTok Video')
        .replace(/[\\/:*?"<>|]/g, '')
        .slice(0, 50);

const author =
    result.author?.unique_id ||
    'tiktok';

const filename =
    `${title} - @${author}.mp4`;

await ctx.telegram.sendDocument(
    ctx.chat.id,
    {
        url: videoUrl,
        filename: filename
    },
    {
        caption:
            `${title}\n` +
            `By: @${author}\n\n` +
            `Owner: @wrrar`
    }
);

        } catch (docErr) {

            console.log('DOCUMENT ERROR:', docErr);

            await ctx.telegram.sendMessage(
                ctx.chat.id,
                'Gagal mengirim full quality'
            );
        }

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

        // Crosscheck body
        if (!req.body) {

            return res
                .status(400)
                .send('No Body');

        }

        // Crosscheck update_id
        if (!req.body.update_id) {

            return res
                .status(400)
                .send('Invalid Update');
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
