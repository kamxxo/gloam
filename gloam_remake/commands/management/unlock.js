module.exports = {
  name: "unlock",
  description:
    "Unlocks a channel and allows user input until the lock command is ran.",
  aliases: ["unfreeze"],
  usage: "",
  cooldown: 0,
  guildOnly: true,
  execute(client, connection, config, message, args) {
    message.channel.overwritePermissions(
      message.guild.defaultRole,
      { SEND_MESSAGES: true },
      "Unlocking"
    );
    message.channel.send(
      client.helpers
        .get("CreateEmptyEmbed")
        .execute("Success", client, false)
        .setTitle("Channel Unlocked 🔓")
        .setDescription(`To lock the channel do ${config.prefix}lock`)
    );
  }
};
