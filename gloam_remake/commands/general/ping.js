module.exports = {
  name: "ping",
  description: "Ping!",
  cooldown: 0,
  guildOnly: true,
  execute(client, connection, config, message, args) {
    message.channel
      .send(
        client.helpers.get("CreateEmptyEmbed").execute("Success", client, true)
      )
      .then(m => {
        m.edit(
          client.helpers
            .get("CreateEmptyEmbed")
            .execute("Success", client, false)
            .setTitle("PONG!")
            .setDescription(
              `Bot Latency is ${m.createdTimestamp -
                message.createdTimestamp}ms. API Latency is ${Math.round(
                client.ping
              )}ms`
            )
        );
      });
  }
};
