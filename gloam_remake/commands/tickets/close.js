module.exports = {
  name: "close",
  description: "Gloam Management",
  cooldown: 0,
  usage: "[reason]",
  guildOnly: true,
  args: true,
  execute(client, connection, config, message, args) {
    if (
      config.tickets.closedReasons &&
      config.tickets.closedReasons.search(args.join(" ")) < 0
    ) {
      return message.channel.send(
        client.helpers
          .get(`CreateEmptyEmbed`)
          .execute(`Warning`, client, false)
          .setTitle(`Invalid Closure Reason`)
          .setDescription(
            `Please use one of the following closure reasons when responding to a ticket\n\`\`\`${config.tickets.closedReasons.join(
              "\n"
            )}\`\`\``
          )
      );
    }
    connection.query(
      `SELECT * FROM Tickets WHERE channelId = "${message.channel.id}"`,
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
                `This command can only be ran inside of a ticket channel.`
              )
          );
        let reason = args.join(" ");
        client.helpers
          .get("CloseTicket")
          .execute(client, connection, config, message, reason, result[0]);
      }
    );
  }
};
