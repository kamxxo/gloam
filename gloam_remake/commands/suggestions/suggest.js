module.exports = {
  name: "suggest",
  description: "Please use this to create suggestions for Gloam.",
  aliases: ["suggests", "suggestion"],
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
          `INSERT INTO Suggestions (creatorId, channelId, status) VALUES ("${message.author.id}", "${ch.id}", "NEW")`,
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
          .setTitle(`Please chose the correct type for your suggestion!`)
          .setDescription(
            "Select the type of suggestion you would like to make below\nYou can do this by selecting the appropriate reaction that corresponds with your suggestion below\nFailure to react in **5 minutes** will automatically close this suggestion"
          );
        for (let i = 0; i < config.suggestions.types.length; i++) {
          const suggestion = config.suggestions.types[i];
          initialQuestionEmbed.setDescription(
            initialQuestionEmbed.description +
              `\n:regional_indicator_${String.fromCharCode(97 + i)}: ${
                suggestion.name
              }`
          );
        }
        ch.send(initialQuestionEmbed)
          .then(m => {
            React(0, config.suggestions.types.length, m);
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
                  config.suggestions.types[
                    emojiCharacters[reaction.emoji.name]
                  ];
                connection.query(
                  `UPDATE Suggestions SET suggestionType = "${question.name}" WHERE channelId = "${ch.id}" AND creatorId = "${message.author.id}"`,
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
                  `UPDATE Suggestions SET closedReason = "No option chosen", status = "Denied", closedDate = '${moment(
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
          ch.guild.channels.find(cat => cat.id == config.suggestions.category)
        );
        let suggestionCreatedEmbed = client.helpers
          .get("CreateEmptyEmbed")
          .execute("Success", client, false)
          .setTitle(`Suggestion Channel Created!`)
          .setDescription(
            `Hello ${message.author.toString()}, Please select the type of suggestion you would like to create under ${ch.toString()}!`
          );
        message.channel.send(suggestionCreatedEmbed);
        ch.send(message.author.toString()).then(notification => {
          notification.delete();
        });
      })
      .catch(console.error);
  }
};
