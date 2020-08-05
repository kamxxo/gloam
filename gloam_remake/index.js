// REQUIRES NODE version 12 or above
const config = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client();
client.commands = new Discord.Collection();
client.helpers = new Discord.Collection();
const cooldowns = new Discord.Collection();
const fs = require("fs");

const mysql = require("mysql");
var connection = mysql.createConnection({
  host: "panel.consoleclients.com",
  user: "qhkbloqyrps",
  password: "91ERXmy!rzQc",
  database: "VenomPvP_TEST"
});

checkFolderForCommands(`${__dirname}/commands`);

const helpers = fs
  .readdirSync("./helpers")
  .filter(file => file.endsWith(".js"));

helpers.forEach(file => {
  const helper = require(`./helpers/${file}`);
  client.helpers.set(helper.name, helper);
});

function checkFolderForCommands(location) {
  const commandFiles = fs.readdirSync(location);
  commandFiles.forEach(file => {
    if (fs.statSync(`${location}/${file}`).isDirectory()) {
      checkFolderForCommands(`${location}/${file}`);
    } else if (file.endsWith(".js")) {
      const command = require(`${location}/${file}`);
      client.commands.set(command.name, command);
    }
  });
}

client.once("ready", () => {
  let readyHandler = require("./eventHandlers/Discord/ready.js");
  readyHandler.execute(client, config, connection);
});

client.on("message", message => {
  let messageHandler = require("./eventHandlers/Discord/message.js");
  messageHandler.execute(
    client,
    config,
    message,
    cooldowns,
    Discord,
    connection
  );
});

client.on("guildMemberAdd", GuildMember => {
  let guildMemberAddHandler = require("./eventHandlers/Discord/guildMemberAdd.js");
  guildMemberAddHandler.execute(client, connection, GuildMember);
});

client.on("guildMemberRemove", GuildMember => {
  let guildMemberAddHandler = require("./eventHandlers/Discord/guildMemberRemove.js");
  guildMemberAddHandler.execute(client, connection, GuildMember);
});

client.on("raw", event => {
  let rawEventHandler = require("./eventHandlers/Discord/rawEventHandler.js");
  rawEventHandler.execute(client, connection, event);
});

client.on("message", message => {
  console.log(message.content);
});

client.login(config.token);
