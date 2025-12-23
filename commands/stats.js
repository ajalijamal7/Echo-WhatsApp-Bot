const { getLastMessages } = require("../messagestore");
const { maybeAutoVoice } = require("../utils/maybeAutoVoice");

module.exports = {
    name: "stats",
    description: "Show chat statistics",
    ownerOnly: true,

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid;

        const messages = getLastMessages(jid, 500);

        if (!messages.length) {
            return sock.sendMessage(jid, {
                text: "❌ No messages stored yet."
            });
        }

        const userCount = {};
        let totalLength = 0;

        for (const m of messages) {
            userCount[m.sender] = (userCount[m.sender] || 0) + 1;
            totalLength += m.text.length;
        }

        const totalMessages = messages.length;
        const users = Object.keys(userCount);
        const activeUsers = users.length;

        let topUser = users[0];
        for (const u of users) {
            if (userCount[u] > userCount[topUser]) {
                topUser = u;
            }
        }

        const avgLength = (totalLength / totalMessages).toFixed(1);

        const firstTime = new Date(messages[0].time * 1000).toLocaleString();
        const lastTime = new Date(messages[messages.length - 1].time * 1000).toLocaleString();

        // ✅ Resolve WhatsApp display name
        let topUserName;
        try {
            topUserName = await sock.getName(topUser);
        } catch {
            topUserName = topUser.replace(/\D/g, "");
        }

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

        await sock.sendMessage(jid, { text: statsText });
        await maybeAutoVoice(sock, jid, statsText);
    }
};
