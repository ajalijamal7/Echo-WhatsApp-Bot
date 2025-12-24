const { getLastMessages } = require("../messagestore");
const { maybeAutoVoice } = require("../utils/maybeAutoVoice");

module.exports = {
    name: "stats",
    description: "Show chat statistics",
    ownerOnly: true,

    run: async ({ sock, msg }) => {
        const groupJid = msg.key.remoteJid;

        const allMessages = getLastMessages(groupJid, 500);

        if (!allMessages.length) {
            return sock.sendMessage(groupJid, {
                text: "❌ No messages stored yet."
            });
        }

        const userCount = {};
        let totalLength = 0;

        for (const m of allMessages) {
            userCount[m.sender] = (userCount[m.sender] || 0) + 1;
            totalLength += m.text.length;
        }

        const totalMessages = allMessages.length;
        const users = Object.keys(userCount);
        const activeUsers = users.length;

        let topUser = users[0];
        for (const u of users) {
            if (userCount[u] > userCount[topUser]) {
                topUser = u;
            }
        }

        const avgLength = (totalLength / totalMessages).toFixed(1);

        const firstTime = new Date(allMessages[0].time * 1000).toLocaleString();
        const lastTime = new Date(allMessages[allMessages.length - 1].time * 1000).toLocaleString();

        const topUserMessage = allMessages.find(m => m.sender === topUser);
        const topUserName = topUserMessage?.pushName || topUser;

        const statsText = `
📊 *Chat Statistics*

📩 Total Messages: ${totalMessages}
👥 Active Users: ${activeUsers}

🥇 Most Active:
${topUserName}
(${userCount[topUser]} messages)

✍️ Avg Message Length: ${avgLength} chars

🕒 Time Range:
${firstTime}
→
${lastTime}
        `.trim();

        await sock.sendMessage(groupJid, { text: statsText });
        await maybeAutoVoice(
            sock,
            msg.key.remoteJid,
            reply,
            {
                enabled: config.autovoice,
                elevenlabs: config.elevenlabs
            }
        );
    }
};
