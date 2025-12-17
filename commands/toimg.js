const sharp = require('sharp')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')

module.exports = {
    name: 'toimg',
    description: 'Convert a sticker to an image',

    run: async ({ sock, msg }) => {
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.stickerMessage) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Reply to a sticker with `.toimg`'
            })
        }

        const mediaMsg = {
            key: {
                remoteJid: msg.key.remoteJid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: ctx.quotedMessage
        }

        try {
            const stickerBuffer = await downloadMediaMessage(
                mediaMsg,
                'buffer',
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            const imageBuffer = await sharp(stickerBuffer)
                .png()
                .toBuffer()

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    image: imageBuffer,
                    caption: '🖼️ Sticker converted to image'
                },
                { quoted: msg }
            )

        } catch (err) {
            console.error('TOIMG ERROR:', err)
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert sticker to image'
            })
        }
    }
}
