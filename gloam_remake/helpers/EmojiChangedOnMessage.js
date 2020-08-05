module.exports = {
  name: "EmojiChangedOnMessage",
  execute(event, client) {
    const config = "../config.json";
    let channel = client.channels.cache.find(ch => ch.id == event.channel_id);
    if (!channel)
      return console.log(`Unable to find channel with id ${event.channel_id}`);
    channel.fetchMessage(event.message_id).then(message => {
      if (!message)
        return console.log(
          `Unable to find message with id ${event.message_id}`
        );
      let oldEmbed = message.embeds.find(m =>
        m.title.includes("New Suggestion by ")
      );
      if (
        !oldEmbed ||
        !(message.reactions.get("✅") && message.reactions.get("❌"))
      )
        return;
      let embed = client.helpers
        .get("CreateEmptyEmbed")
        .execute("Success", client, false)
        .setTitle(oldEmbed.title)
        .setDescription(oldEmbed.description);
      for (let i = 0; i < oldEmbed.fields.length - 1; i++) {
        const f = oldEmbed.fields[i];
        embed.addField(f.name, f.value, f.inline);
      }
      embed.setTimestamp(oldEmbed.timestamp);
      message.reactions
        .get("✅")
        .fetchUsers()
        .then(y => {
          message.reactions
            .get("❌")
            .fetchUsers()
            .then(x => {
              y = y.size;
              x = x.size;
              let approvalRating = ((y - 1) / (x + y - 2)) * 100;
              if (isNaN(approvalRating)) {
                embed.addField(`Approval Rating`, `N/A`);
              } else {
                embed.addField(
                  `Approval Rating`,
                  `${Math.trunc(approvalRating)}%`
                );
              }
              message.edit(embed);
            });
        });
    });
  }
};
