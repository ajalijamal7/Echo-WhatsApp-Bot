const { downloadMediaMessage } = require('@whiskeysockets/baileys')

module.exports = {
    name: 'video',
    description: 'Resend a replied video as a normal video',

    run: async ({ sock, msg }) => {
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.videoMessage) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Reply to a video with `.video`'
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

            const videoBuffer = await downloadMediaMessage(
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
                    video: videoBuffer,
                    caption: '🎥 Resent video'
                },
                { quoted: msg }
            )

        } catch (err) {
            console.error('VIDEO ERROR:', err)
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to send video'
            })
        }
    }
}
