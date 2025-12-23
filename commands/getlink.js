const yts = require("yt-search");

module.exports = {
    name: "getlink",
    description: "Get YouTube video link",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid;
        const query = args.join(" ");

        if (!query) {
            return sock.sendMessage(jid, { text: "❌ Usage: .getlink <search text>" });
        }

        const res = await yts(query);
        const video = res.videos[0];

        if (!video) {
            return sock.sendMessage(jid, { text: "❌ No video found." });
        }

        await sock.sendMessage(jid, {
            text: `🔗 ${video.title}\n${video.url}`
        });
    }
};
