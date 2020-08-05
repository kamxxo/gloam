const { DiscordAPIError } = require("discord.js");

module.exports = {
  name: "apply",
  description:
    "Creates a new application for the Glaom Management team to review.",
  aliases: ["application"],
  usage: "",
  cooldown: 0,
  guildOnly: true,
  execute(client, connection, config, message, args) {
    const emojiCharacters = require("../../helpers/emojiCharacters.js");
    const moment = require("moment");
    const Discord = require("discord.js");

    // here we create the new channel
    message.guild.channels
      .create(`${message.member.displayName}`, {
        permissionOverwrites: [
          {
            id: message.author.id,
            allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "SEND_MESSAGES"],
            deny: ["ADD_REACTIONS"]
          }
        ]
      })
      .then(ch => {
        connection.query(
          `INSERT INTO Applications (creatorId, channelId, status) VALUES ("${message.author.id}", "${ch.id}", "NEW")`,
          (err, result) => {
            if (err)
              return client.helpers
                .get("MYSQLErrorHandler")
                .InsertError(message.channel, err, client);
          }
        );

        // here we create a new embed
        // why does this fail?
        let initialQuestionEmbed = client.helpers
          .get("CreateEmptyEmbed")
          .execute("Success", client, false)
          .setTitle(`Please chose your application type!`)
          .setDescription(
            "Select the type of application you would like to submit below\nYou can do this by selecting the appropriate reaction that corresponds with your application type below\nFailure to react in **5 minutes** will automatically close this application"
          );

        if (initialQuestionEmbed == null) {
          message.channel.send(
            "Failed to create embed, please notify the gloam programmer."
          );
          return;
        }

        for (let i = 0; i < config.applications.types.length; i++) {
          const appType = config.applications.types[i];
          initialQuestionEmbed.setDescription(
            initialQuestionEmbed.description +
              `\n:regional_indicator_${String.fromCharCode(97 + i)}: ${
                appType.name
              }`
          );
        }

        ch.send(initialQuestionEmbed)
          .then(m => {
            React(0, config.applications.types.length, m);
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
                  config.applications.types[
                    emojiCharacters[reaction.emoji.name]
                  ];
                connection.query(
                  `UPDATE Applications SET applicationType = "${question.name}" WHERE channelId = "${ch.id}" AND creatorId = "${message.author.id}"`,
                  (err, result) => {
                    if (err)
                      return client.helpers
                        .get("MYSQLErrorHandler")
                        .UpdateError(message.channel, err, client);
                    question.access.forEach(role => {
                      ch.overwritePermissions(
                        ch.guild.roles.cache.find(r => r.name == role),
                        {
                          VIEW_CHANNEL: true,
                          SEND_MESSAGES: true,
                          READ_MESSAGE_HISTORY: true,
                          ADD_REACTIONS: true
                        }
                      );
                    });
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
                  `UPDATE Applications SET closedReason = "No option chosen", status = "CLOSED", closedDate = '${moment(
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

        // find returns undefined if not found
        const id = ch.guild.channels.cache.find(
          cat => cat.id == config.applications.category
        );

        if (id) {
          ch.setParent(id)
            .then(parent => console.log(`New parent ${parent}`))
            .catch(console.error);
        }

        let applicationCreatedEmbed = client.helpers
          .get("CreateEmptyEmbed")
          .execute("Success", client, false)
          .setTitle(`Application Created!`)
          .setDescription(
            `Hello ${message.author.toString()}, Please select the type of application you would like to create under ${ch.toString()}!`
          );
        message.channel.send(applicationCreatedEmbed);
        ch.send(message.author.toString()).then(notification => {
          notification.delete();
        });
      })
      .catch(console.error);
  }
};
