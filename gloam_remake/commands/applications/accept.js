module.exports = {
  name: "accept",
  description: "Accepts an application",
  cooldown: 0,
  usage: "[reason]",
  guildOnly: true,
  args: true,
  execute(client, connection, config, message, args) {
    const moment = require("moment");
    connection.query(
      `SELECT * FROM Applications WHERE channelId = "${message.channel.id}"`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .SelectError(message.channel, err, client);
        if (result.length == 0)
          return message.channel.send(
            client.helpers
              .get("CreateEmptyEmbed")
              .execute("Warning", client, false)
              .setTitle(`Invalid Channel!`)
              .setDescription(
                `This command can only be ran inside of an application channel.`
              )
          );
        connection.query(
          `UPDATE Applications SET closedReason = "${args.join(
            " "
          )}", closedDate = '${moment(new Date()).format(
            "YYYY-MM-DD HH:mm:ss"
          )}', closedBy = "${
            message.author.id
          }", status = "ACCEPTED" WHERE id = "${result[0].id}"`,
          err => {
            if (err)
              return client.helpers
                .get("MYSQLErrorHandler")
                .UpdateError(message.channel, err, client);
            message.channel
              .send(
                client.helpers
                  .get(`CreateEmptyEmbed`)
                  .execute(`Success`, client, false)
                  .setTitle(`Application Accepted`)
                  .setDescription(`This channel will be deleted in 5 seconds`)
              )
              .then(m => {
                setTimeout(() => {
                  m.channel.delete();
                }, 5000);
              });
            message.guild.fetchMember(result[0].creatorId).then(member => {
              member.send(
                client.helpers
                  .get("CreateEmptyEmbed")
                  .execute("Success", client, false)
                  .setTitle(`Application accepted`)
                  .setDescription(
                    `Your ${
                      config.applications.types.find(
                        t => t.name == result[0].applicationType
                      ).name
                    } has been accepted!`
                  )
                  .addField("Accepted By:", message.author.toString())
                  .addField("Reason", args.join(" "))
              );
            });
          }
        );
      }
    );
  }
};
