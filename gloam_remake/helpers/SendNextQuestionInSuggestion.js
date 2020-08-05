module.exports = {
  name: "SendNextQuestionInSuggestion",
  execute(message, client, config, connection) {
    connection.query(
      `SELECT * FROM Suggestions WHERE channelId = "${message.channel.id}" AND creatorId = "${message.author.id}" and status = "NEW"`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .SelectError(message.channel, err, client);
        if (!(result && result.length > 0)) return;
        if (
          result[0].suggestionType == null ||
          result[0].suggestionStage == null
        ) {
          message.channel
            .send(
              client.helpers
                .get("CreateEmptyEmbed")
                .execute("Warning", client, false)
                .setTitle(
                  "Please choose an option on the suggestion to continue"
                )
                .setDescription(
                  "To do this find the relevant option to your suggestion and react to the corresponding emoji."
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
                  `Please do not attach files/images to the suggestion directly.\n\nPlease use a site like imgur or gyazo to attach files and then send the link instead.\n\n**This message will automatically be deleted in 30 seconds**`
                )
            )
            .then(m => {
              setTimeout(() => {
                message.delete();
                m.delete();
              }, 30000);
            });
        }
        let question = config.suggestions.types.find(
          t => t.name == result[0].suggestionType
        );
        if (!question)
          return message.channel.send(
            "No valid config found the the selected suggestion. Please contact an admin"
          );
        connection.query(
          `INSERT INTO SuggestionResponse (suggestionId, suggestionStage, response) VALUES (${result[0].id}, ${result[0].suggestionStage}, "${message.content}")`,
          err => {
            if (err)
              return client.helpers
                .get("MYSQLErrorHandler")
                .InsertError(message.channel, err, client);
            if (result[0].suggestionStage < question.questions.length) {
              let questionEmbed = client.helpers
                .get("CreateEmptyEmbed")
                .execute("Success", client, false)
                .setTitle("Please answer the following question")
                .setDescription(question.questions[result[0].suggestionStage]);
              connection.query(
                `UPDATE Suggestions SET suggestionStage = ${result[0]
                  .suggestionStage + 1} WHERE channelId = "${
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
              `UPDATE Suggestions SET status = "IN PROGRESS" WHERE channelId = "${message.channel.id}" AND creatorId = "${message.author.id}"`,
              err => {
                if (err)
                  return client.helpers
                    .get("MYSQLErrorHandler")
                    .UpdateError(message.channel, err, client);
                message.channel.fetchMessages({ limit: 100 }).then(messages => {
                  message.channel.bulkDelete(messages);
                  connection.query(
                    `SELECT * FROM SuggestionResponse WHERE suggestionId = ${result[0].id} ORDER BY suggestionStage ASC`,
                    (err, result) => {
                      if (err)
                        return client.helpers
                          .get("MYSQLErrorHandler")
                          .SelectError(message.channel, err, client);
                      let suggestionDetails = client.helpers
                        .get("CreateEmptyEmbed")
                        .execute("Success", client, false)
                        .setTitle(
                          `New Suggestion by ${message.author.username} #${result[0].suggestionId}`
                        )
                        .setDescription(
                          `\`${config.prefix}saccept ${result[0].suggestionId} [reason]\` to accept a suggestion\n\`${config.prefix}sdeny ${result[0].suggestionId} [reason]\` to deny a suggestion`
                        )
                        .setThumbnail(message.author.avatarURL);
                      for (let i = 0; i < result.length; i++) {
                        const detail = result[i];
                        suggestionDetails.addField(
                          question.questions[detail.suggestionStage - 1],
                          detail.response,
                          true
                        );
                      }
                      suggestionDetails.addField(`Approval Rating`, `N/A`);
                      let suggestionChannel = message.guild.channels.find(
                        ch => ch.id == config.suggestions.openChannel
                      );
                      if (!suggestionChannel) {
                        return message.channel.send(
                          client.helpers
                            .get("CreateEmptyEmbed")
                            .execute("Warning", client, false)
                            .setTitle(`Unable to find the suggestion channel`)
                            .setDescription(
                              `Please let an admin know that they must define a valid openSuggestion channel ID in config.json`
                            )
                        );
                      }
                      suggestionChannel.send(suggestionDetails).then(m => {
                        connection.query(
                          `UPDATE Suggestions SET suggestionMessageId = "${m.id}", status = "Open" WHERE id = ${result[0].suggestionId}`,
                          err => {
                            if (err)
                              return client.helpers
                                .get("MYSQLErrorHandler")
                                .UpdateError(message.channel, err, client);
                          }
                        );
                        m.react("✅").then(() => {
                          m.react("❌");
                        });
                      });
                      message.channel
                        .send(
                          client.helpers
                            .get(`CreateEmptyEmbed`)
                            .execute(`Success`, client, false)
                            .setTitle(`Suggestion Created`)
                            .setDescription(
                              `Your suggestion has been posted in ${suggestionChannel.toString()}.\nYou will be notified once your suggestion has been accepted/denied.\n**This channel will be deleted in 15 seconds.**`
                            )
                        )
                        .then(m => {
                          setTimeout(() => {
                            m.delete();
                            m.channel.delete();
                          }, 15000);
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
