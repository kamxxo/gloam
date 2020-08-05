module.exports = {
  name: "purge",
  description: "Removes the most recent specified number of messages.",
  aliases: ["prune"],
  usage: "[amount of messages]",
  cooldown: 0,
  guildOnly: true,
  args: true,
  execute(client, connection, config, message, args) {
    message.delete().then(m => {
      const amount = parseInt(args[0]);
      if (isNaN(amount)) {
        return message.channel.send(
          client.helpers
            .get("CreateEmptyEmbed")
            .execute("Warning", client, false)
            .setTitle("Invalid Value")
            .setDescription(`${args[0]} isn't a valid value`)
        );
      }
      if (amount > 100) {
        return message.channel.send(
          client.helpers
            .get("CreateEmptyEmbed")
            .execute("Warning", client, false)
            .setTitle(`Invalid value ${amount}`)
            .setDescription(`Your number must be between 1-100`)
        );
      }
      message.channel
        .bulkDelete(amount, true)
        .then(messages => {
          message.channel
            .send(
              client.helpers
                .get("CreateEmptyEmbed")
                .execute("Success", client, false)
                .setTitle(`${messages.size} messages deleted!`)
            )
            .then(m => {
              setTimeout(() => {
                m.delete();
              }, 5000);
            });
        })
        .catch(err => {
          message.channel.send(
            client.helpers
              .get("CreateEmptyEmbed")
              .execute("Warning", client, false)
              .setTitle(`Unknown error performing that command.`)
          );
          if (err)
            return client.helpers
              .get("MYSQLErrorHandler")
              .UnknownError(message.channel, err, client);
        });
    });
  }
};
