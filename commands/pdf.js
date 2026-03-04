const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { getLastMessages } = require("../messagestore");

module.exports = {
    name: "pdf",
    description: "Convert images to PDF",
    ownerOnly: false,
    groupOnly: false,

    async run({ sock, msg, args }) {
        const from = msg.key.remoteJid;
        const tempFile = path.join(__dirname, "temp_" + Date.now() + ".pdf");

        try {
            const count = parseInt(args[0]) || 1;

            const quoted =
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            let images = [];

            // CASE 1: User replied to image
            if (quoted?.imageMessage) {
                images.push({
                    message: quoted
                });

                if (count > 1) {
                    const messages = getLastMessages(from, 50)
                        .filter(m => m.message?.imageMessage)
                        .slice(-count + 1);

                    images = [...messages, ...images];
                }

            } else {
                // CASE 2: Not replying → use recent images
                const messages = getLastMessages(from, 50)
                    .filter(m => m.message?.imageMessage)
                    .slice(-count);

                images = messages;
            }

            if (!images.length) {
                return sock.sendMessage(from, {
                    text: "❌ No images found to convert."
                });
            }

            const pdfDoc = await PDFDocument.create();

            for (const imgMsg of images) {
                const buffer = await downloadMediaMessage(
                    imgMsg,
                    "buffer",
                    {},
                    { logger: console }
                );

                let image;
                const mime = imgMsg.message.imageMessage.mimetype;

                if (mime === "image/png") {
                    image = await pdfDoc.embedPng(buffer);
                } else {
                    image = await pdfDoc.embedJpg(buffer);
                }

                const { width, height } = image.scale(1);
                const page = pdfDoc.addPage([width, height]);

                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width,
                    height
                });
            }

            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(tempFile, pdfBytes);

            await sock.sendMessage(from, {
                document: fs.readFileSync(tempFile),
                mimetype: "application/pdf",
                fileName: "converted_images.pdf"
            });

        } catch (err) {
            console.error("PDF ERROR:", err);
            await sock.sendMessage(from, {
                text: "❌ Failed to create PDF."
            });
        } finally {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        }
    }
};