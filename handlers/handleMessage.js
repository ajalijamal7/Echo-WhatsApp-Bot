const fs = require("fs");
const path = require("path");
const { globalOwnerOnly, globalGroupOnly, owners } = require("../config");
const { prefix } = require("../helper_commands/settings");
const { saveMessage, getLastMessages } = require("../messagestore");


const commands = {};

const commandFiles = fs.readdirSync(path.join(__dirname, "../commands"));

for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands[command.name] = command;
}

function normalizeNumber(jid) {
  return jid?.replace(/\D/g, "");
}

function isOwner(msg) {
  if (msg.key.fromMe === true) return true;

  const senderJid = msg.key.participant || msg.key.remoteJid;

  const senderNumber = normalizeNumber(senderJid);

  return owners.includes(senderNumber);
}

function isGroup(msg) {
  return msg.key.remoteJid.endsWith("@g.us");
}

function getText(msg) {
  if (!msg.message) return null;

  const m = msg.message;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;

  if (m.ephemeralMessage?.message) {
    return getText({ message: m.ephemeralMessage.message });
  }

  if (m.viewOnceMessage?.message) {
    return getText({ message: m.viewOnceMessage.message });
  }

  return null;
}

module.exports = async (sock, msg) => {
  if (msg.key.remoteJid === "status@broadcast") return;

  const text = getText(msg);
  if (!text) return;

  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || jid;


  const ts =
    msg.messageTimestamp?.low ??
    msg.messageTimestamp;


  if (ts && !text.startsWith(prefix)) {
    saveMessage(jid, sender, text, ts);
  }


  console.log(getLastMessages(msg.key.remoteJid, 50));


  if (!text.startsWith(prefix)) return;

  const args = text.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = commands[commandName];
  if (!command) return;




  if (!command.ignoreGlobal) {
    if (globalOwnerOnly && !isOwner(msg)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Commands are restricted to bot owners.",
      });
    }

    if (globalGroupOnly && !isGroup(msg)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Commands can only be used in groups.",
      });
    }
  }

  if (command.ownerOnly && !isOwner(msg)) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ This command is owner-only.",
    });
  }

  if (command.groupOnly && !isGroup(msg)) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ This command can only be used in groups.",
    });
  }

  try {
    await command.run({ sock, msg, args });
  } catch (err) {
    console.error("COMMAND ERROR:", err);
  }

};
