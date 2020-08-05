module.exports = {
  name: "CreateEmptyEmbed",
  execute(color, client, loading) {
    const config = require("../config.json");
    const Discord = require("discord.js");
    let embed = new Discord.MessageEmbed()
      .setAuthor(
        client.user.username,
        client.user.avatarURL,
        "https://discord.gg/gloam"
      )
      .setTimestamp(new Date())
      .setFooter("Created by owner#0001", client.user.avatarURL);

    if (!embed) {
      console.log("Something went wrong with the embed");
      return null;
    }

    if (color === "Warning") {
      embed.setColor(config.embed.warningColor);
    } else if (color === "Standard") {
      embed.setColor(config.embed.standardColor);
    } else if (color === "Success") {
      embed.setColor(config.embed.successColor);
    }

    if (loading) {
      embed.setTitle("Loading...");
      embed.setAuthor(
        client.user.username,
        "https://imgur.com/2SGqVci.gif",
        "https://discord.gg/gloam"
      );
    }

    return embed;
  }
};
