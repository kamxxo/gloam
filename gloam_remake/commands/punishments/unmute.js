module.exports = {
  name: "unmute",
  description: "Unmute a user",
  usage: "[@username]",
  cooldown: 0,
  guildOnly: true,
  args: true,
  execute(client, connection, config, message, args) {
    let user = client.helpers
      .get("GetUserFromMention")
      .execute(args[0], client);
    if (!user) {
      return message.reply("Invalid User");
    }
    connection.query(
      `UPDATE Punishments set pardoned = "True" WHERE punishmentTo = ${user.id} AND type = 'Muted'`,
      err => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .UpdateError(message.channel, err, client);
        let unmutedEmbed = client.helpers
          .get("CreateEmptyEmbed")
          .execute("Success", client, false)
          .setTitle(`${user.username} Unmuted!`)
          .setThumbnail(user.avatarURL)
          .setDescription(
            `${message.author.username} unmuted ${user.username}`
          );
        message.channel.send(unmutedEmbed).then(m => {
          setTimeout(() => {
            m.delete();
          }, 5000);
        });
        client.channels
          .find(channel => channel.id == config.logging.punishmentChannel)
          .send(unmutedEmbed)
          .then(m => {
            message.guild.members
              .find(gm => gm.id == user.id)
              .removeRole(
                message.guild.roles.find(r => r.id == config.mutedRoleId)
              );
          });
      }
    );
  }
};
