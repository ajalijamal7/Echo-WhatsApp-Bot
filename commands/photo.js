const { downloadMediaMessage } = require('@whiskeysockets/baileys')

module.exports = {
    name: 'photo',
    description: 'Resend a replied image as a normal photo',

    run: async ({ sock, msg }) => {
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.imageMessage) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Reply to an image with `.photo`'
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

            const imgBuffer = await downloadMediaMessage(
                mediaMsg,
                'buffer',
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    image: imgBuffer,
                    caption: '🖼️ Resent image'
                },
                { quoted: msg }
            )

        } catch (err) {
            console.error('PHOTO ERROR:', err)
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to send photo'
            })
        }
    }
}
