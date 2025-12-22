const fs = require("fs")

module.exports = {
    name: 'resetmemory',
    description: 'Reset the memory of the bot',
    ownerOnly: true,
  
    run: async ({ sock, msg }) => {

        fs.writeFileSync("./memory.json", JSON.stringify({}))
    
      await sock.sendMessage(msg.key.remoteJid, {
        text: '♻️ The memory has been reset'
      })
    }
  }
  