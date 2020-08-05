module.exports = {
  name: "SendNextQuestionInTicket",
  execute(message, client, config, connection) {
    connection.query(
      `SELECT * FROM Tickets WHERE channelId = "${message.channel.id}" AND creatorId = "${message.author.id}" and status = "NEW"`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .SelectError(message.channel, err, client);
        if (!(result && result.length > 0)) return;
        if (result[0].ticketType == null || result[0].ticketStage == null) {
          message.channel
            .send(
              client.helpers
                .get("CreateEmptyEmbed")
                .execute("Warning", client, false)
                .setTitle("Please choose an option on the ticket to continue")
                .setDescription(
                  "To do this find the relevant option to your request and react to the corresponding emoji.\n\n**This message will automatically be deleted in 30 seconds**"
                )
            )
            .then(m => {
              setTimeout(() => {
                m.delete();
              }, 30000);
            });
          return message.delete();
        }
        if (message.attachments.size > 0) {
          return message.channel
            .send(
              client.helpers
                .get(`CreateEmptyEmbed`)
                .execute(`Warning`, client, false)
                .setTitle(`Invalid Format`)
                .setDescription(
                  `Please do not attach files/images to the ticket directly.\n\nPlease use a site like imgur or gyazo to attach files and then send the link instead.\n\n**This message will automatically be deleted in 30 seconds**`
                )
            )
            .then(m => {
              setTimeout(() => {
                message.delete();
                m.delete();
              }, 30000);
            });
        }
        let question = config.tickets.types.find(
          t => t.name == result[0].ticketType
        );
        if (!question)
          return message.channel.send(
            "No valid config found the the selected ticket. Please close this ticket with -close and raise a new ticket with -new"
          );
        connection.query(
          `INSERT INTO TicketResponse (ticketId, ticketStage, response) VALUES (${result[0].id}, ${result[0].ticketStage}, "${message.content}")`,
          err => {
            if (err)
              return client.helpers
                .get("MYSQLErrorHandler")
                .InsertError(message.channel, err, client);
            if (result[0].ticketStage < question.questions.length) {
              let questionEmbed = client.helpers
                .get("CreateEmptyEmbed")
                .execute("Success", client, false)
                .setTitle("Please answer the following question")
                .setDescription(question.questions[result[0].ticketStage]);
              connection.query(
                `UPDATE Tickets SET ticketStage = ${result[0].ticketStage +
                  1} WHERE channelId = "${
                  message.channel.id
                }" AND creatorId = "${message.author.id}"`,
                err => {
                  if (err)
                    return client.helpers
                      .get("MYSQLErrorHandler")
                      .UpdateError(message.channel, err, client);
                  message.channel.send(questionEmbed);
                }
              );
              return;
            }
            connection.query(
              `UPDATE Tickets SET status = "IN PROGRESS" WHERE channelId = "${message.channel.id}" AND creatorId = "${message.author.id}"`,
              err => {
                if (err)
                  return client.helpers
                    .get("MYSQLErrorHandler")
                    .UpdateError(message.channel, err, client);
                message.channel.fetchMessages({ limit: 100 }).then(messages => {
                  message.channel.bulkDelete(messages);
                  connection.query(
                    `SELECT * FROM TicketResponse WHERE ticketId = ${result[0].id} ORDER BY ticketStage ASC`,
                    (err, result) => {
                      if (err)
                        return client.helpers
                          .get("MYSQLErrorHandler")
                          .SelectError(message.channel, err, client);
                      let ticketDetails = client.helpers
                        .get("CreateEmptyEmbed")
                        .execute("Success", client, false)
                        .setTitle("Ticket Details")
                        .setDescription(
                          `${config.prefix}close to close a ticket \n${config.prefix}leader to assign the user the faction leader role`
                        );
                      for (let i = 0; i < result.length; i++) {
                        const detail = result[i];
                        ticketDetails.addField(
                          question.questions[detail.ticketStage - 1],
                          detail.response,
                          true
                        );
                      }
                      message.channel.send(ticketDetails);
                      let staffRole = message.channel.guild.roles.find(
                        r => r.id == config.staffRoleId
                      );
                      if (!staffRole) {
                        return message.channel.send(
                          "Warning. Unable to find staff role to mention! Please fix in the config.json."
                        );
                      }
                      if (!staffRole.mentionable) {
                        return message.channel.send(
                          "Warning. Staff role isn't mentionable. Please fix in order to notify staff."
                        );
                      }
                      message.channel.send(staffRole.toString()).then(m => {
                        m.delete();
                      });
                    }
                  );
                });
              }
            );
          }
        );
      }
    );
  }
};
