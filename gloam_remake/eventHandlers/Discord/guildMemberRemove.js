module.exports = {
  execute(client, connection, guildMember) {
    let config = require("../../config.json");
    connection.query(
      `SELECT * FROM Tickets where CreatorId = "${guildMember.user.id}" AND status = "NEW"`,
      (err, result) => {
        const moment = require("moment");
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .SelectError(message.channel, err, client);
        if (result == 0) return;
        result.forEach(r => {
          let channel = guildMember.guild.channels.cache.find(
            ch => ch.id == r.channelId
          );
          if (channel.deletable) {
            channel
              .delete()
              .then(ch => {})
              .catch(err => {});
          }
          connection.query(
            `UPDATE Tickets SET closedReason = "User Left", status = "CLOSED", closedDate = '${moment(
              new Date()
            ).format("YYYY-MM-DD HH:mm:ss")}' WHERE channelId = "${
              r.channelId
            }" AND creatorId = "${guildMember.user.id}"`,
            (err, result) => {
              if (err)
                return client.helpers
                  .get("MYSQLErrorHandler")
                  .UpdateError(message.channel, err, client);
            }
          );
        });
      }
    );
  }
};
