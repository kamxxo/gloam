module.exports = {
  execute(client, config, connection) {
    console.log("Bot Ready");
    client.user
      .setActivity(`${config.prefix}new`, { type: "PLAYING" })
      .then(presence =>
        console.log(
          `Activity set to ${
            presence.game ? presence.game.name : "discord.gg/gloam"
          }`
        )
      )
      .catch(console.error);
  }
};
