module.exports = {
  name: "GetUserFromMention",
  execute(mention, client) {
    if (!mention) return;
    if (mention.startsWith("<@") && mention.endsWith(">")) {
      mention = mention.slice(2, -1);
      if (mention.startsWith("!")) {
        mention = mention.slice(1);
      }
      return client.users.get(mention);
    }
  }
};
