const config = require("../config");

module.exports = {
    name: "autovoice",
    ownerOnly: true,

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid;

        if (!args[0] || !["on", "off"].includes(args[0])) {
            return sock.sendMessage(jid, {
                text: "Usage: .autovoice on | off"
            });
        }

        config.autovoice = args[0] === "on";

        await sock.sendMessage(jid, {
            text: `Autovoice ${config.autovoice ? "enabled" : "disabled"}`
        });
    }
};
