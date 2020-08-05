module.exports = {
  name: "MYSQLErrorHandler",
  UpdateError(channel, err, client) {
    console.log(err);
    return channel.send(
      client.helpers
        .get("CreateEmptyEmbed")
        .execute("Warning", client, false)
        .setTitle("Error updating data into the database.")
        .setDescription(`Please check the console for the error.`)
    );
  },
  SelectError(channel, err, client) {
    console.log(err);
    return channel.send(
      client.helpers
        .get("CreateEmptyEmbed")
        .execute("Warning", client, false)
        .setTitle("Error selecting data from the database.")
        .setDescription(`Please check the console for the error.`)
    );
  },
  InsertError(channel, err, client) {
    console.log(err);
    return channel.send(
      client.helpers
        .get("CreateEmptyEmbed")
        .execute("Warning", client, false)
        .setTitle("Error inserting data into the database.")
        .setDescription(`Please check the console for the error.`)
    );
  },
  UnknownError(channel, err, client) {
    console.log(err);
    return channel.send(
      client.helpers
        .get("CreateEmptyEmbed")
        .execute("Warning", client, false)
        .setTitle("An unknown error has occurred.")
        .setDescription(`Please check the console for the error.`)
    );
  }
};
