const axios = require("axios")
const FormData = require("form-data")
const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { REMOVE_BG_API_KEY } = require("../config")

let sharp
try {
    sharp = require("sharp")
} catch {
    sharp = null
}

function resolveBinary(winName, unixName) {
    const local = path.join(__dirname, "..", "bin", winName)
    if (process.platform === "win32" && fs.existsSync(local)) {
        return `"${local}"`
    }
    return unixName
}

const FFMPEG = resolveBinary("ffmpeg.exe", "ffmpeg")

module.exports = {
    name: "sticker",
    description: "Fast image/video sticker",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo
        const quoted = ctx?.quotedMessage

        if (!quoted?.imageMessage && !quoted?.videoMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an *image or video* with `.sticker`"
            })
        }

        const mediaMsg = {
            key: {
                remoteJid: jid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: quoted
        }

        const tempDir = path.join(__dirname, "../temp")
        fs.mkdirSync(tempDir, { recursive: true })

        if (quoted.imageMessage) {
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

                if (sharp) {
                    try {
                        const stickerBuffer = await sharp(imgBuffer)
                            .resize(512, 512, {
                                fit: "contain",
                                background: { r: 0, g: 0, b: 0, alpha: 0 }
                            })
                            .webp({ quality: 70 })
                            .toBuffer()

                        await sock.sendMessage(jid, { sticker: stickerBuffer })
                        return
                    } catch { }
                }

                if (!REMOVE_BG_API_KEY) {
                    throw new Error("remove.bg API key not configured and sharp failed")
                }

                const inputPng = path.join(tempDir, `img_${Date.now()}.png`)
                const outputWebp = path.join(tempDir, `sticker_${Date.now()}.webp`)

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

                fs.writeFileSync(inputPng, response.data)

                await new Promise((res, rej) => {
                    const cmd = `
                    ${FFMPEG} -y
                    -i "${inputPng}"
                    -vf "scale=512:512:force_original_aspect_ratio=decrease,
                    pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000"
                    -c:v libwebp
                    -q:v 70
                    -pix_fmt yuva420p
                    "${outputWebp}"
                    `.replace(/\n/g, " ")

                    exec(cmd, (err, stdout, stderr) => {
                        if (err) rej(stderr || err.message)
                        else res()
                    })
                })

                await sock.sendMessage(jid, {
                    sticker: fs.readFileSync(outputWebp)
                })

                fs.unlinkSync(inputPng)
                fs.unlinkSync(outputWebp)

            } catch (err) {
                await sock.sendMessage(jid, {
                    text: `❌ Image sticker error:\n\n${err.toString().slice(0, 4000)}`
                })
            }
            return
        }

        if (quoted.videoMessage) {
            const inputPath = path.join(tempDir, `vid_${Date.now()}.mp4`)
            const outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`)

            try {
                const videoBuffer = await downloadMediaMessage(
                    mediaMsg,
                    "buffer",
                    {},
                    {
                        logger: sock.logger,
                        reuploadRequest: sock.updateMediaMessage
                    }
                )

                fs.writeFileSync(inputPath, videoBuffer)

                await new Promise((res, rej) => {
                    const cmd = `
                    ${FFMPEG} -y -t 6
                    -i "${inputPath}"
                    -vf "scale=512:512,fps=12,
                    pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000"
                    -c:v libwebp
                    -q:v 70
                    -pix_fmt yuva420p
                    -loop 0
                    "${outputPath}"
                    `.replace(/\n/g, " ")

                    exec(cmd, (err, stdout, stderr) => {
                        if (err) rej(stderr || err.message)
                        else res()
                    })
                })

                await sock.sendMessage(jid, {
                    sticker: fs.readFileSync(outputPath)
                })

            } catch (err) {
                await sock.sendMessage(jid, {
                    text: `❌ Video sticker error:\n\n${err.toString().slice(0, 4000)}`
                })
            }

            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        }
    }
}
