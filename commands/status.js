const os = require("os");
const { botName } = require("../helper_commands/settings");
const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

module.exports = {
    name: "status",
    description: "Show bot system status",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid;

        const uptimeSeconds = process.uptime();

        const seconds = Math.floor(uptimeSeconds % 60);
        const minutes = Math.floor((uptimeSeconds / 60) % 60);
        const hours = Math.floor((uptimeSeconds / 3600) % 24);
        const days = Math.floor(uptimeSeconds / 86400);

        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const memoryMB =
            (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

        const nodeVersion = process.version;
        const platform = os.platform();

        const text =
            `🤖 ${botName} Status
━━━━━━━━━━━━━━
🟢 Online
⏱ Uptime: ${uptime}
🧠 Memory: ${memoryMB} MB
⚙️ Node: ${nodeVersion}
📦 Platform: ${platform}`;

        await sock.sendMessage(jid, { text });
        await maybeAutoVoice(
            sock,
            msg.key.remoteJid,
            text,
            {
                enabled: config.autovoice,
                elevenlabs: config.elevenlabs
            }
        );
    }
};
