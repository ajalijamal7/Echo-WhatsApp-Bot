const axios = require("axios");
const FormData = require("form-data");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { REMOVE_BG_API_KEY } = require("../config");

function resolveBinary(winName, unixName) {
    const local = path.join(__dirname, "..", "bin", winName);
    if (process.platform === "win32" && fs.existsSync(local)) {
        return local;
    }
    return unixName;
}

const FFMPEG = resolveBinary("ffmpeg.exe", "ffmpeg");

module.exports = {
    name: "sticker",
    description: "Convert image/video to sticker (background removed for images)",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid;
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const quoted = ctx?.quotedMessage;

        if (!quoted?.imageMessage && !quoted?.videoMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an *image or video* with `.sticker`"
            });
        }

        const mediaMsg = {
            key: {
                remoteJid: jid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: quoted
        };

        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        try {
            /* ================= IMAGE ================= */
            if (quoted.imageMessage) {
                if (!REMOVE_BG_API_KEY) {
                    return sock.sendMessage(jid, {
                        text: "❌ remove.bg API key is not configured."
                    });
                }

                const imgBuffer = await downloadMediaMessage(
                    mediaMsg,
                    "buffer",
                    {},
                    {
                        logger: sock.logger,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );

                const formData = new FormData();
                formData.append("image_file", imgBuffer, {
                    filename: "input.png",
                    contentType: "image/png"
                });
                formData.append("size", "auto");

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
                );

                const noBgPngBuffer = Buffer.from(response.data);

                const webpBuffer = await sharp(noBgPngBuffer)
                    .resize(512, 512, {
                        fit: "contain",
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .webp({ quality: 80 })
                    .toBuffer();

                return sock.sendMessage(jid, { sticker: webpBuffer });
            }

            /* ================= VIDEO ================= */
            if (quoted.videoMessage) {
                const inputPath = path.join(tempDir, "input.mp4");
                const outputPath = path.join(tempDir, "sticker.webp");

                const videoBuffer = await downloadMediaMessage(
                    mediaMsg,
                    "buffer",
                    {},
                    {
                        logger: sock.logger,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );

                fs.writeFileSync(inputPath, videoBuffer);

                await new Promise(resolve => {
                    exec(
                        `"${FFMPEG}" -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -loop 0 -an -vsync 0 "${outputPath}"`,
                        { windowsHide: true },
                        () => resolve()
                    );
                });

                if (!fs.existsSync(outputPath)) {
                    throw new Error("Video sticker conversion failed");
                }

                await sock.sendMessage(jid, {
                    sticker: fs.readFileSync(outputPath)
                });

                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
            }

        } catch (err) {
            console.error("STICKER ERROR:", err);
            await sock.sendMessage(jid, {
                text: "❌ Failed to create sticker."
            });
        }
    }
};
