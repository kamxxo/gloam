module.exports = {
  execute(client, config, message, cooldowns, Discord, connection) {
    if (!message) {
      console.log("message not found");
      return;
    }
    if (!message.content.startsWith(config.prefix)) {
      if (
        message.channel.parent &&
        message.channel.parent.id == config.tickets.category
      ) {
        client.helpers
          .get("SendNextQuestionInTicket")
          .execute(message, client, config, connection);
      } else if (
        message.channel.parent &&
        message.channel.parent.id == config.suggestions.category
      ) {
        client.helpers
          .get("SendNextQuestionInSuggestion")
          .execute(message, client, config, connection);
      } else if (
        message.channel.parent &&
        message.channel.parent.id == config.applications.category
      ) {
        client.helpers
          .get("SendNextQuestionInApplication")
          .execute(message, client, config, connection);
      }
      return;
    }
    if (message.author.bot) return;
    const args = message.content.slice(config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        cmd => cmd.aliases && cmd.aliases.includes(commandName)
      );
    if (!command) return;
    if (command.guildOnly && message.channel.type !== "text") {
      return message.reply("I can't execute that command inside DMs!");
    }
    if (command != "purge") {
      message.delete();
    }
    if (
      !client.helpers
        .get("MemberHasPermissionForCommand")
        .execute(config, command.name, message.member)
    ) {
      return message.reply(
        "You don't have the required permissions to run that command."
      );
    }
    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}!`;
      if (command.usage) {
        reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``;
      }
      return message.channel.send(reply);
    }
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 0) * 1000;
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(
          `please wait ${timeLeft.toFixed(
            1
          )} more second(s) before reusing the \`${command.name}\` command.`
        );
      }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    try {
      command.execute(client, connection, config, message, args);
    } catch (error) {
      console.error(error);
      message.reply("there was an error trying to execute that command!");
    }
  }
};
