module.exports = {
  name: "CloseTicket",
  execute(client, connection, config, message, reason, ticket) {
    const moment = require("moment");
    const fs = require("fs");
    message.delete();
    if (
      !(
        ticket.creatorId == message.author.id ||
        message.member.roles.cache.find(r => r.id == config.staffRoleId) ||
        message.member.hasPermission("ADMINISTRATOR")
      )
    ) {
      return message.channel.send(
        client.helpers
          .get("CreateEmptyEmbed")
          .execute("Warning", client, false)
          .setTitle(`Unable to Close Ticket!`)
          .setDescription(
            "Only the creator and staff have the required permissions to close tickets."
          )
      );
    }
    connection.query(
      `UPDATE Tickets SET closedReason = "${reason}", closedDate = '${moment(
        new Date()
      ).format("YYYY-MM-DD HH:mm:ss")}', closedBy = "${
        message.author.id
      }", status = "CLOSED" WHERE id = "${ticket.id}"`,
      (err, result) => {
        if (err)
          return client.helpers
            .get("MYSQLErrorHandler")
            .UpdateError(message.channel, err, client);
        let responseText = [];
        let messages = message.channel.fetchMessages({ limit: 100 }).then(m => {
          m.forEach(chat => {
            let message = "";
            if (chat.embeds.length > 0) {
              chat.embeds.forEach(e => {
                if (e.fields) {
                  e.fields.forEach(f => {
                    if (message == "") {
                      if (e.description) {
                        message = `[${moment(chat.createdTimestamp).format(
                          "DD-MM-YYYY HH:mm:ss"
                        )}] [EMBED] ${chat.member.displayName}: ${e.title} : ${
                          e.description
                        }`;
                        message += `\n ->   ${f.name}: ${f.value}`;
                      } else {
                        message = `[${moment(chat.createdTimestamp).format(
                          "DD-MM-YYYY HH:mm:ss"
                        )}] [EMBED] ${chat.member.displayName}: ${e.title}`;
                        message += `\n ->   ${f.name}: ${f.value}`;
                      }
                    } else {
                      message += `\n ->   ${f.name}: ${f.value}`;
                    }
                  });
                }
              });
            } else {
              message = `[${moment(chat.createdTimestamp).format(
                "DD-MM-YYYY HH-mm-ss"
              )}] ${chat.member.displayName}: ${chat.content}`;
            }
            responseText.push(message);
          });
          let currentDate = new Date();
          responseText = responseText.reverse();
          let name = `./ticketlogs/${message.channel.name}-${moment(
            currentDate
          ).format("DD-MM-YYYY_HH-mm-ss")}.txt`;
          fs.writeFile(name, responseText.join("\n"), function(err) {
            if (err)
              return client.helpers
                .get("MYSQLErrorHandler")
                .UnknownError(message.channel, err, client);
            let emptyEmbed = client.helpers
              .get("CreateEmptyEmbed")
              .execute("Success", client, false)
              .setTitle(`Ticket Closed!`)
              .addField("Closed Reason", reason)
              .addField(
                "Created By",
                message.guild.members
                  .find(m => m.id == ticket.creatorId)
                  .toString()
              )
              .addField("Closed By", message.member.toString())
              .attachFile(name);
            message.guild.channels.cache
              .find(c => c.id == config.tickets.closedTicketChannel)
              .send(emptyEmbed);
            message.guild.members.cache
              .find(m => m.id == ticket.creatorId)
              .send(emptyEmbed);
            message.channel.delete();
          });
        });
      }
    );
  }
};
