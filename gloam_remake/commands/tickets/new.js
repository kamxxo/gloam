module.exports = {
  name: "new",
  description: "Creats a ticket for the Gloam staff team to handle.",
  aliases: ["ticket"],
  usage: "",
  cooldown: 0,
  guildOnly: true,
  execute(client, connection, config, message, args) {
    const emojiCharacters = require("../../helpers/emojiCharacters.js");
    const moment = require("moment");
    message.guild
      .createChannel(`${message.member.displayName}`, {
        permissionOverwrites: [
          {
            id: message.author.id,
            allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "SEND_MESSAGES"],
            deny: ["ADD_REACTIONS"]
          },
          {
            id: message.guild.defaultRole,
            deny: [
              "VIEW_CHANNEL",
              "SEND_MESSAGES",
              "READ_MESSAGE_HISTORY",
              "ADD_REACTIONS"
            ]
          },
          {
            id: config.staffRoleId,
            allow: [
              "VIEW_CHANNEL",
              "SEND_MESSAGES",
              "READ_MESSAGE_HISTORY",
              "ADD_REACTIONS"
            ]
          }
        ]
      })
      .then(ch => {
        connection.query(
          `INSERT INTO Tickets (creatorId, channelId, status) VALUES ("${message.author.id}", "${ch.id}", "NEW")`,
          (err, result) => {
            if (err)
              return client.helpers
                .get("MYSQLErrorHandler")
                .InsertError(message.channel, err, client);
          }
        );
        let initialQuestionEmbed = client.helpers
          .get("CreateEmptyEmbed")
          .execute("Success", client, false)
          .setTitle(`Please chose your ticket type!`)
          .setDescription(
            "Select the type of ticket you would like to create below\nYou can do this by selecting the appropriate reaction that corresponds with your inquiry below\nFailure to react in **5 minutes** will automatically close this ticket"
          );
        for (let i = 0; i < config.tickets.types.length; i++) {
          const ticketType = config.tickets.types[i];
          initialQuestionEmbed.setDescription(
            initialQuestionEmbed.description +
              `\n:regional_indicator_${String.fromCharCode(97 + i)}: ${
                ticketType.name
              }`
          );
        }
        ch.send(initialQuestionEmbed)
          .then(m => {
            React(0, config.tickets.types.length, m);

            function React(mini, maxi, message) {
              if (mini < maxi) {
                m.react(emojiCharacters[String.fromCharCode(97 + mini)]).then(
                  r => {
                    mini++;
                    React(mini++, maxi, message);
                  }
                );
              }
            }
            const filter = (reaction, user) => {
              return user.id === message.author.id;
            };
            m.awaitReactions(filter, { max: 1, time: 300000, errors: ["time"] })
              .then(collected => {
                const reaction = collected.first();
                let question =
                  config.tickets.types[emojiCharacters[reaction.emoji.name]];
                connection.query(
                  `UPDATE Tickets SET ticketType = "${question.name}" WHERE channelId = "${ch.id}" AND creatorId = "${message.author.id}"`,
                  (err, result) => {
                    if (err)
                      return client.helpers
                        .get("MYSQLErrorHandler")
                        .UpdateError(message.channel, err, client);
                    if (question.adminOnly == true) {
                      ch.overwritePermissions(
                        ch.guild.roles.find(r => r.id == config.staffRoleId),
                        {
                          VIEW_CHANNEL: false,
                          SEND_MESSAGES: false,
                          READ_MESSAGE_HISTORY: false,
                          ADD_REACTIONS: false
                        }
                      );
                    }
                    ch.setName(
                      `${message.member.displayName}-${question.name.replace(
                        / /g,
                        "-"
                      )}`.toLowerCase()
                    );
                    ch.send(
                      client.helpers
                        .get("CreateEmptyEmbed")
                        .execute("Success", client, false)
                        .setTitle("Please answer the following question")
                        .setDescription(question.questions[0])
                    );
                  }
                );
              })
              .catch(collected => {
                connection.query(
                  `UPDATE Tickets SET closedReason = "No option chosen", status = "CLOSED", closedDate = '${moment(
                    new Date()
                  ).format("YYYY-MM-DD HH:mm:ss")}' WHERE channelId = "${
                    ch.id
                  }" AND creatorId = "${message.author.id}"`,
                  (err, result) => {
                    ch.delete();
                    if (err)
                      return client.helpers
                        .get("MYSQLErrorHandler")
                        .UpdateError(message.channel, err, client);
                  }
                );
              });
          })
          .catch(console.error);
        ch.setParent(
          ch.guild.channels.find(cat => cat.id == config.tickets.category)
        );
        ch.setTopic(`${config.prefix}close [reason] to close the ticket`);
        let ticketCreatedEmbed = client.helpers
          .get("CreateEmptyEmbed")
          .execute("Success", client, false)
          .setTitle(`Ticket Created!`)
          .setDescription(
            `Hello ${message.author.toString()}, Please select the type of ticket you would like to create under ${ch.toString()}! Staff will be with you as soon as possible!`
          );
        message.channel.send(ticketCreatedEmbed);
        ch.send(message.author.toString()).then(notification => {
          notification.delete();
        });
      })
      .catch(console.error);
  }
};
