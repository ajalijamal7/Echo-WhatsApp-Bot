const axios = require("axios")
const FormData = require("form-data")
const sharp = require("sharp")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { REMOVE_BG_API_KEY } = require("../config")

module.exports = {
    name: "sticker",
    description: "Convert image to sticker without the background",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.imageMessage) {
            return sock.sendMessage(jid, { text: "❌ Reply to an image with `.sticker`" })
        }

        if (!REMOVE_BG_API_KEY) {
            return sock.sendMessage(jid, { text: "❌ remove.bg API key is not configured." })
        }

        const mediaMsg = {
            key: {
                remoteJid: jid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: ctx.quotedMessage
        }

        try {
           
            const imgBuffer = await downloadMediaMessage(
                mediaMsg,
                "buffer",
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            
            const formData = new FormData()
            formData.append("image_file", imgBuffer, {
                filename: "input.png",
                contentType: "image/png"
            })
            formData.append("size", "auto")

            const response = await axios.post(
                "https://api.remove.bg/v1.0/removebg",
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        "X-Api-Key": REMOVE_BG_API_KEY
                    },
                    responseType: "arraybuffer",
                    timeout: 60000
                }
            )

            const noBgPngBuffer = Buffer.from(response.data)

            const webpBuffer = await sharp(noBgPngBuffer)
                .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 80 })
                .toBuffer()

           
            await sock.sendMessage(jid, { sticker: webpBuffer })

        } catch (err) {
            
            const apiErr =
                err.response?.data
                    ? Buffer.isBuffer(err.response.data)
                        ? err.response.data.toString("utf8")
                        : err.response.data
                    : null

            console.error("STICKER (remove bg) ERROR:", apiErr || err)

            await sock.sendMessage(jid, { text: "❌ Failed to remove background / create sticker." })
        }
    }
}
