module.exports = {
  execute(client, connection, GuildMember) {
    let config = require("../../config.json");
    let welcomeEmbed = client.helpers
      .get("CreateEmptyEmbed")
      .execute("Success", client, false)
      .setTitle(`Welcome ${GuildMember.displayName} to VenomPvP`)
      .setDescription(config.welcomeMessage.join("\n"));
    client.channels.cache
      .find(ch => ch.id == config.welcomeMessageChannelId)
      .send(welcomeEmbed);
  }
};
