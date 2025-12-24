const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getLastMessages } = require("../messagestore");
const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

module.exports = {
    name: "summary",
    description: "Summarize recent group conversation",
    groupOnly: true,

    run: async ({ sock, msg }) => {
        const groupJid = msg.key.remoteJid;

        let conversationText;

        // 🔹 CASE 1: Command is a reply → summarize only the replied message
        const quoted =
            msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (quoted) {
            let quotedText = null;
            let quotedName = "User";

            if (quoted.conversation) {
                quotedText = quoted.conversation;
            } else if (quoted.extendedTextMessage?.text) {
                quotedText = quoted.extendedTextMessage.text;
            }

            const participant =
                msg.message.extendedTextMessage.contextInfo.participant;

            if (participant) {
                try {
                    quotedName = await sock.getName(participant);
                } catch { }
            }

            if (!quotedText) {
                return sock.sendMessage(groupJid, {
                    text: "❌ Replied message has no text to summarize."
                });
            }

            conversationText = `${quotedName}: ${quotedText}`;
        }

        // 🔹 CASE 2: Normal summary → use stored messages
        else {
            const messages = getLastMessages(groupJid, 200);

            if (!messages || messages.length < 5) {
                return sock.sendMessage(groupJid, {
                    text: "❌ Not enough messages to summarize yet."
                });
            }

            conversationText = messages
                .map(m => `${m.pushName}: ${m.text}`)
                .join("\n");
        }

        const prompt = `
You are Echo, a WhatsApp group assistant bot.

Summarize the following conversation.

Rules:
- Refer to users by their names (e.g. "Ali says...", "John mentions...")
- Do NOT invent names
- Do NOT include phone numbers or timestamps
- Keep the summary concise and clear

Conversation:
${conversationText}

Summary:
`.trim();

        try {
            const genAI = new GoogleGenerativeAI(config.summaryApiKey);

            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash-lite"
            });

            const result = await model.generateContent(prompt);
            const summary = result.response.text();

            await sock.sendMessage(groupJid, {
                text: `📝 *Summary*\n\n${summary}`
            });

            await maybeAutoVoice(
                sock,
                msg.key.remoteJid,
                summary,
                {
                    enabled: config.autovoice,
                    elevenlabs: config.elevenlabs
                }
            );
        } catch (err) {
            console.error("SUMMARY ERROR:", err);

            await sock.sendMessage(groupJid, {
                text: "❌ Failed to generate summary."
            });
        }
    }
};
