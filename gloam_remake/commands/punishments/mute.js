module.exports = {
  name: "mute",
  description: "Mute a user for a specific reason",
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
    let reason = args.splice(1).join(" ");
    connection.query(
      `INSERT INTO Punishments (type, reason, punishmentTo, punishmentFrom) VALUES ("Muted", "${reason}", ${user.id}, ${message.author.id})`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .InsertError(message.channel, err, client);
        let mutedEmbed = client.helpers
          .get("CreateEmptyEmbed")
          .execute("Warning", client, false)
          .setTitle(`${user.username} Muted!`)
          .setThumbnail(user.avatarURL)
          .setDescription(
            `${message.author.username} muted ${user.username} for \`\`${reason}\`\``
          );
        message.channel.send(mutedEmbed).then(m => {
          setTimeout(() => {
            m.delete();
          }, 5000);
        });
        client.channels
          .find(channel => channel.id == config.logging.punishmentChannel)
          .send(mutedEmbed);
        user
          .send(
            client.helpers
              .get("CreateEmptyEmbed")
              .execute("Warning", client, false)
              .setTitle(`You've been muted`)
              .setThumbnail(message.author.avatarURL)
              .setDescription(
                `You've been muted for \`\`${reason}\`\` by ${message.author.username}`
              )
          )
          .then(m => {
            message.guild.members
              .find(gm => gm.id == user.id)
              .addRole(
                message.guild.roles.find(r => r.id == config.mutedRoleId)
              );
          });
      }
    );
  }
};
