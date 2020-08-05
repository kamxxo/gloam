module.exports = {
  name: "SendNextQuestionInApplication",
  execute(message, client, config, connection) {
    connection.query(
      `SELECT * FROM Applications WHERE channelId = "${message.channel.id}" AND creatorId = "${message.author.id}" and status = "NEW"`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .SelectError(message.channel, err, client);
        if (!(result && result.length > 0)) return;
        if (
          result[0].applicationType == null ||
          result[0].applicationType == null
        ) {
          message.channel
            .send(
              client.helpers
                .get("CreateEmptyEmbed")
                .execute("Warning", client, false)
                .setTitle(
                  "Please choose an option on the application to continue"
                )
                .setDescription(
                  "To do this find the relevant option to your application and react to the corresponding emoji.\n\n**This message will automatically be deleted in 30 seconds**"
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
                  `Please do not attach files/images to the application directly.\n\nPlease use a site like imgur or gyazo to attach files and then send the link instead.\n\n**This message will automatically be deleted in 30 seconds**`
                )
            )
            .then(m => {
              setTimeout(() => {
                message.delete();
                m.delete();
              }, 30000);
            });
        }
        let question = config.applications.types.find(
          t => t.name == result[0].applicationType
        );
        if (!question)
          return message.channel.send(
            "No valid config found the the selected application. Please close this application with -deny and raise a new application with -apply"
          );
        connection.query(
          `INSERT INTO ApplicationResponse (applicationId, applicationStage, response) VALUES (${result[0].id}, ${result[0].applicationStage}, "${message.content}")`,
          err => {
            if (err)
              return client.helpers
                .get("MYSQLErrorHandler")
                .InsertError(message.channel, err, client);
            if (result[0].applicationStage < question.questions.length) {
              let questionEmbed = client.helpers
                .get("CreateEmptyEmbed")
                .execute("Success", client, false)
                .setTitle("Please answer the following question")
                .setDescription(question.questions[result[0].applicationStage]);
              connection.query(
                `UPDATE Applications SET applicationStage = ${result[0]
                  .applicationStage + 1} WHERE channelId = "${
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
              `UPDATE Applications SET status = "IN PROGRESS" WHERE channelId = "${message.channel.id}" AND creatorId = "${message.author.id}"`,
              err => {
                if (err)
                  return client.helpers
                    .get("MYSQLErrorHandler")
                    .UpdateError(message.channel, err, client);
                message.channel.fetchMessages({ limit: 100 }).then(messages => {
                  message.channel.bulkDelete(messages);
                  connection.query(
                    `SELECT * FROM ApplicationResponse WHERE applicationId = ${result[0].id} ORDER BY applicationStage ASC`,
                    (err, result) => {
                      if (err)
                        return client.helpers
                          .get("MYSQLErrorHandler")
                          .SelectError(message.channel, err, client);
                      let applicationDetails = client.helpers
                        .get("CreateEmptyEmbed")
                        .execute("Success", client, false)
                        .setTitle("Application Details")
                        .setDescription(
                          `${config.prefix}accept [reason] to accept the application\n${config.prefix}deny [reason] to deny the application`
                        );
                      for (let i = 0; i < result.length; i++) {
                        const detail = result[i];
                        if (detail.response.length < 1024) {
                          applicationDetails.addField(
                            question.questions[detail.applicationStage - 1],
                            detail.response,
                            true
                          );
                        } else {
                          message.channel.send(applicationDetails);
                          applicationDetails = client.helpers
                            .get("CreateEmptyEmbed")
                            .execute("Success", client, false)
                            .setTitle(
                              question.questions[detail.applicationStage - 1]
                            )
                            .setDescription(detail.response);
                        }
                      }
                      message.channel.send(applicationDetails);
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
