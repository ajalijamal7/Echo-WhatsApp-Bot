function getSenderNumber(msg) {
  const senderJid = msg.key.participant || msg.key.remoteJid;
  const senderNumber = senderJid?.replace(/\D/g, "");
  return senderNumber;
}

module.exports = {
  name: "checkid",
  description: "Check your Whatsapp ID",

  run: async ({ sock, msg }) => {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `Your ID: ${getSenderNumber(msg)}`,
    });
  },
};
