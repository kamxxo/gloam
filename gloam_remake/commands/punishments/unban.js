module.exports = {
  name: "unban",
  description:
    "Un-temporarily bans a user. This will remove all temporary  bans related to that user!",
  usage: "[@username]",
  alias: [`pardon`],
  cooldown: 0,
  guildOnly: true,
  args: true,
  execute(client, connection, config, message, args) {
    if (args.length != 1) {
      return message.reply("Invalid Arguments");
    }
    let user = client.helpers
      .get("GetUserFromMention")
      .execute(args[0], client);
    if (!user) {
      return message.reply("Invalid User");
    }
    connection.query(
      `UPDATE Punishments SET pardoned = 'True' WHERE punishmentTo = ${user.id} AND type = 'TempBan')`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .UpdateError(message.channel, err, client);
        if (
          message.guild.members
            .find(m => m.id == user.id)
            .roles.find(r => r.id == config.tempBanRoleId)
        ) {
          message.guild.members
            .find(m => m.id == user.id)
            .removeRole(
              message.guild.roles.find(r => r.id == config.tempBanRoleId)
            );
        }
        client.channels
          .find(channel => channel.id == config.logging.punishmentChannel)
          .send(
            client.helpers
              .get("CreateEmptyEmbed")
              .execute("Success", client, false)
              .setTitle(`${user.username} Unbanned`)
              .setThumbnail(user.avatarURL)
              .setDescription(
                `${message.author.username} Unbanned ${user.username}`
              )
          );
        user.send(
          client.helpers
            .get("CreateEmptyEmbed")
            .execute("Success", client, false)
            .setTitle(`You've been Unbanned`)
            .setThumbnail(message.author.avatarURL)
            .setDescription(
              `You've been Unbanned by ${message.author.username}!`
            )
        );
      }
    );
  }
};
