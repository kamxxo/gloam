module.exports = {
  name: "leader",
  description: "Gloam Management",
  cooldown: 0,
  guildOnly: true,
  execute(client, connection, config, message, args) {
    connection.query(
      `SELECT * FROM Tickets WHERE channelId = "${message.channel.id}"`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .SelectError(message.channel, err, client);
        if (result.length > 0) {
          let leaderRole = message.guild.roles.find(
            r => r.id == config.leaderRoleId
          );
          if (!leaderRole)
            return message.channel.send(
              "Invalid leader role ID defined in config. Please talk to staff to get this fixed."
            );
          message.guild.members
            .find(m => m.id == result[0].creatorId)
            .addRole(leaderRole);
          client.helpers
            .get("CloseTicket")
            .execute(
              client,
              connection,
              config,
              message,
              "Leader role granted",
              result[0]
            );
        } else {
          message.channel.send(
            client.helpers
              .get("CreateEmptyEmbed")
              .execute("Warning", client, false)
              .setTitle(`Invalid Channel!`)
              .setDescription(
                `This command can only be ran inside of a ticket channel.`
              )
          );
        }
      }
    );
  }
};
