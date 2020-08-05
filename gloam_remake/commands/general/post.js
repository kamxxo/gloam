module.exports = {
  name: "post",
  description: "Allows you to send a message as the bot.",
  aliases: ["sudo"],
  usage: "[message]",
  cooldown: 0,
  guildOnly: true,
  execute(client, connection, config, message, args) {
    message.channel.send(
      client.helpers
        .get("CreateEmptyEmbed")
        .execute("Standard", client, false)
        .setTitle(`Thank you, Gloam Management :two_hearts:`)
        .setDescription(args.join(" "))
    );
  }
};
