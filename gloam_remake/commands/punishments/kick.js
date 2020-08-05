module.exports = {
  name: "kick",
  description: "Kick a user for a specific reason",
  usage: "[@username] [reason]",
  cooldown: 0,
  guildOnly: true,
  args: true,
  execute(client, connection, config, message, args) {
    if (args.length < 2) {
      return message.reply("Invalid Arguments");
    }
    let user = client.helpers
      .get("GetUserFromMention")
      .execute(args[0], client);
    if (!user) {
      return message.reply("Invalid User");
    }
    let reason = "";
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (reason == "") {
        reason = arg;
      } else {
        reason += " " + arg;
      }
    }
    connection.query(
      `INSERT INTO Punishments (type, reason, punishmentTo, punishmentFrom) VALUES ("Kicked", "${reason}", ${user.id}, ${message.author.id})`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .InsertError(message.channel, err, client);
        let kickedEmbed = client.helpers
          .get("CreateEmptyEmbed")
          .execute("Warning", client, false)
          .setTitle(`${user.username} kicked`)
          .setThumbnail(user.avatarURL)
          .setDescription(
            `${message.author.username} kicked ${user.username} for \`\`${reason}\`\``
          );
        message.channel.send(kickedEmbed).then(m => {
          setTimeout(() => {
            m.delete();
          }, 5000);
        });
        client.channels
          .find(channel => channel.id == config.logging.punishmentChannel)
          .send(kickedEmbed);
        user
          .send(
            client.helpers
              .get("CreateEmptyEmbed")
              .execute("Warning", client, false)
              .setTitle(`You've been kicked`)
              .setThumbnail(message.author.avatarURL)
              .setDescription(
                `You've been kicked for \`\`${reason}\`\` by ${message.author.username}`
              )
          )
          .then(m => {
            message.guild.members.find(gm => gm.id == user.id).kick(reason);
          });
      }
    );
  }
};
