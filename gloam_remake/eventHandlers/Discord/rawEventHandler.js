module.exports = {
  execute(client, connection, event) {
    if (
      event.t == "MESSAGE_REACTION_REMOVE" ||
      event.t == "MESSAGE_REACTION_ADD"
    ) {
      client.helpers.get("EmojiChangedOnMessage").execute(event.d, client);
    }
  }
};
