module.exports = {
  name: "calc",
  description: "Calculate a math expression",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Usage: .calc 5 + 3 * 2",
      });
    }

    const expression = args.join(" ");

    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Invalid characters in expression",
      });
    }

    let result;

    try {
      result = Function(`"use strict"; return (${expression})`)();
    } catch (err) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Invalid math expression",
      });
    }

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🧮 Result: ${result}`,
    });
  },
};
