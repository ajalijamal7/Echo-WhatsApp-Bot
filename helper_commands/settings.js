const fs = require("fs");

const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));

module.exports = {
  prefix: settings.prefix,
  botName: settings.botname,
};
