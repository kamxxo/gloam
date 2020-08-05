module.exports = {
  name: "MemberHasPermissionForCommand",
  execute(config, command, guildMember) {
    let hasPerms = false;
    if (
      config.permissions[command].length == 0 ||
      guildMember.hasPermission("ADMINISTRATOR")
    )
      hasPerms = true;
    else {
      config.permissions[command].forEach(roleName => {
        if (guildMember.roles.cache.find(r => r.name == roleName))
          hasPerms = true;
      });
    }
    return hasPerms;
  }
};
