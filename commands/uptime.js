const { maybeAutoVoice } = require("../utils/maybeAutoVoice");

module.exports = {
    name: "uptime",
    description: "Show how long the bot has been running",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid;

        const uptimeSeconds = process.uptime();

        const seconds = Math.floor(uptimeSeconds % 60);
        const minutes = Math.floor((uptimeSeconds / 60) % 60);
        const hours = Math.floor((uptimeSeconds / 3600) % 24);
        const days = Math.floor(uptimeSeconds / 86400);

        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const text = `⏱ Uptime: ${uptime}`;

        await sock.sendMessage(jid, { text });
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
