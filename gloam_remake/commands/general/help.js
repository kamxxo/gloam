module.exports = {
  name: "help",
  description: "List all of my commands or info about a specific command.",
  aliases: ["commands"],
  usage: "[command name]",
  cooldown: 0,
  execute(client, connection, config, message, args) {
    var isStaff = false;
    if (message.member.roles.cache.find(role => role.name == config.staffRole))
      isStaff = true;
    message.delete();
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      let commandsEmbed = client.helpers
        .get("CreateEmptyEmbed")
        .execute("Success", client, false)
        .setTitle("Commands");
      commands.forEach(command => {
        if (
          client.helpers
            .get("MemberHasPermissionForCommand")
            .execute(config, command.name, message.member)
        ) {
          if (command.usage)
            commandsEmbed.addField(
              `${config.prefix}${command.name} ${command.usage}`,
              command.description
            );
          else
            commandsEmbed.addField(
              `${config.prefix}${command.name}`,
              command.description
            );
        }
      });
      return message.channel.send(commandsEmbed);
    }

    const name = args[0].toLowerCase();
    const command =
      commands.get(name) ||
      commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return message.channel.send(
        client.helpers
          .get("CreateEmptyEmbed")
          .execute("Warning", client, false)
          .setTitle("Invalid command name")
          .setDescription(
            `Please use ${config.prefix}help to view all available commands`
          )
      );
    }
    if (
      !client.helpers
        .get("MemberHasPermissionForCommand")
        .execute(config, name, message.member)
    ) {
      return message.channel.send(
        client.helpers
          .get("CreateEmptyEmbed")
          .execute("Warning", client, false)
          .setTitle("Invalid Permissions")
          .setDescription(
            `You do not have the required role to view details about this command`
          )
      );
    }
    commandEmbed = client.helpers
      .get("CreateEmptyEmbed")
      .execute("Success", client, false)
      .setTitle(`Help for ${command.name}`)
      .addField(`Usage:`, `${config.prefix}${command.name} ${command.usage}`)
      .addField(`Description`, command.description);
    if (command.aliases)
      commandEmbed.addField(`Aliases`, command.aliases.join(", "));
    if (command.cooldown) {
      commandEmbed.addField(`Cooldown`, `${command.cooldown}s`);
    } else {
      commandEmbed.addField(`Cooldown`, `0s`);
    }
    message.channel.send(commandEmbed);
  }
};
