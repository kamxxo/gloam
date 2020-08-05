module.exports = {
  name: "lock",
  description:
    "Locks a channel and prevents user input until the unlock command is ran.",
  aliases: ["freeze"],
  usage: "",
  cooldown: 0,
  guildOnly: true,
  execute(client, connection, config, message, args) {
    message.channel.overwritePermissions(
      message.guild.defaultRole,
      { SEND_MESSAGES: false },
      "Locking"
    );
    message.channel.send(
      client.helpers
        .get("CreateEmptyEmbed")
        .execute("Success", client, false)
        .setTitle("Channel Locked 🔒")
        .setDescription(`To unlock the channel do ${config.prefix}unlock`)
    );
  }
};
