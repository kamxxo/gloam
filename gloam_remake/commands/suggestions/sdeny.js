module.exports = {
  name: "sdeny",
  description: "Allows you to deny a specific suggestion.",
  aliases: [],
  usage: "[suggestion Id] [Reason]",
  cooldown: 0,
  guildOnly: true,
  execute(client, connection, config, message, args) {
    const moment = require("moment");
    if (args.length < 2) {
      return message.channel.send(
        client.helpers
          .get(`CreateEmptyEmbed`)
          .execute(`Warning`, client, false)
          .setTitle(`Invalid Arguments`)
          .setDescription(
            `Please run the help command to find the correct format for sdeny`
          )
      );
    }
    connection.query(
      `SELECT * FROM Suggestions where id = ${args[0]} and status = "Open"`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .SelectError(message.channel, err, client);
        if (result.length == 0) {
          return message.channel
            .send(
              client.helpers
                .get(`CreateEmptyEmbed`)
                .execute(`Warning`, client, false)
                .setTitle(`Invalid ID`)
                .setDescription(
                  `Unable to find any currently open suggestions with that ID`
                )
            )
            .then(m => {
              setTimeout(() => {
                m.delete();
              }, 5000);
            });
        }
        connection.query(
          `UPDATE Suggestions SET status = "Denied", closedReason = "${args[0]
            .split(1)
            .join(" ")}", closedBy = "${
            message.author.id
          }", closedDate = '${moment(new Date()).format(
            "YYYY-MM-DD HH:mm:ss"
          )}' WHERE id = ${args[0]}`,
          err => {
            if (err)
              return client.helpers
                .get("MYSQLErrorHandler")
                .UpdateError(message.channel, err, client);
            let openChannel = client.channels.find(
              ch => ch.id == config.suggestions.openChannel
            );
            if (!openChannel) {
              message.channel
                .send(
                  client.helpers
                    .get(`CreateEmptyEmbed`)
                    .execute(`Warning`, client, false)
                    .setTitle(`Invalid Channel Configuration`)
                    .setDescription(
                      `Please configure the openChannel in config.json`
                    )
                )
                .then(m => {
                  setTimeout(() => {
                    m.delete();
                  }, 5000);
                });
            }
            openChannel.fetchMessage(result[0].suggestionMessageId).then(m => {
              m.delete();
              let deniedChannel = client.channels.find(
                ch => ch.id == config.suggestions.deniedChannel
              );
              RecreateEmbed(client, result, message, args, m, embed => {
                client.fetchUser(result[0].creatorId).then(u => {
                  u.send(
                    embed.setTitle(
                      `Suggestion #${result[0].id} denied by ${message.member.displayName}`
                    )
                  );
                });
              });
              if (!deniedChannel) {
                return message.channel
                  .send(
                    client.helpers
                      .get(`CreateEmptyEmbed`)
                      .execute(`Warning`, client, false)
                      .setTitle(`Invalid Channel Configuration`)
                      .setDescription(
                        `Please configure the deniedChannel in config.json`
                      )
                  )
                  .then(m => {
                    setTimeout(() => {
                      m.delete();
                    }, 5000);
                  });
              }
              RecreateEmbed(client, result, message, args, m, embed => {
                deniedChannel.send(embed);
              });
            });
          }
        );
      }
    );
    function RecreateEmbed(client, result, message, args, m, cb) {
      let deniedEmbed = client.helpers
        .get(`CreateEmptyEmbed`)
        .execute(`Warning`, client, false);
      client.fetchUser(result[0].creatorId).then(u => {
        deniedEmbed.setTitle(
          `Suggestion #${result[0].id} by ${u.username} denied`
        );
        deniedEmbed.addField(`Denied By`, message.author.toString());
        deniedEmbed.addField(`Reason`, args[0].split(1).join(" "));
        let oldEmbed = m.embeds.find(m =>
          m.title.includes("New Suggestion by ")
        );
        for (let i = 0; i < oldEmbed.fields.length - 1; i++) {
          const f = oldEmbed.fields[i];
          deniedEmbed.addField(f.name, f.value, f.inline);
        }
        cb(deniedEmbed);
      });
    }
  }
};
