require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');

module.exports.config = {
    api: {
        bodyParser: true,
    },
};

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===============================
// TikTok Downloader
// ===============================

async function getTikTokData(url) {
    try {

        const api =
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

        const res = await axios.get(api);

        if (!res.data || !res.data.data) {
            return null;
        }

        return res.data.data;

    } catch (err) {

        console.log(err);

        return null;
    }
}

// ===============================
// Start Command
// ===============================

bot.start(async (ctx) => {

    await ctx.reply(
        `📥 TikTok Downloader Bot\n\n` +
        `Kirim link:\n` +
        `• Video TikTok\n` +
        `• Slideshow\n` +
        `• Story TikTok`
    );

});

// ===============================
// Handle Message
// ===============================

bot.on('text', async (ctx) => {

    const text = ctx.message.text;

    // cek link
    if (!text.includes('tiktok.com')) {
        return ctx.reply('❌ Itu bukan link TikTok');
    }

    const wait = await ctx.reply('⏳ Downloading...');

    try {

        const data = await getTikTokData(text);

        if (!data) {
            return ctx.reply('❌ Gagal mengambil data TikTok');
        }

        // ===========================
        // Slideshow
        // ===========================

        if (data.images && data.images.length > 0) {

            const media = data.images.map((img, index) => ({
                type: 'photo',
                media: img,
                caption:
                    index === 0
                        ? `📸 ${data.title || 'TikTok Slide'}`
                        : undefined
            }));

            await ctx.replyMediaGroup(media);

        }

        // ===========================
        // Video
        // ===========================

        else if (data.play) {

            await ctx.replyVideo(
                { url: data.play },
                {
                    caption:
                        `🎬 ${data.title || 'TikTok Video'}\n\n` +
                        `👤 ${data.author?.nickname || '-'}`
                }
            );

        }

        else {

            await ctx.reply('❌ Media tidak ditemukan');

        }

        // hapus pesan loading
        await ctx.deleteMessage(wait.message_id);

    } catch (err) {

        console.log(err);

        await ctx.reply('❌ Terjadi error');

    }

});

// ===============================
// Webhook Handler
// ===============================

module.exports = async (req, res) => {

    // test browser
    if (req.method === 'GET') {
        return res.status(200).send('Bot aktif 🚀');
    }

    // hanya POST dari Telegram
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {

        const update = req.body;

        // debug body kosong
        if (!update) {
            return res.status(400).send('No body received');
        }

        await bot.handleUpdate(update);

        return res.status(200).send('OK');

    } catch (err) {

        console.log(err);

        return res.status(500).send('Internal Server Error');

    }

};
