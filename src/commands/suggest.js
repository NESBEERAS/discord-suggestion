const { RichEmbed } = require('discord.js');

const reactions = ['👍','👎'];

const call = async function(message, params) {
  if (params.length < 2) return;
  const topic = params.splice(0, 1)[0].toLowerCase();

  const guild = message.client.guildStore.get(message.guild.id);
  let channel = Object.entries(guild.channels).filter(v => v[1].topic.toLowerCase() === topic);
  if (channel.length > 0) {
    const channelTopic = channel[0][1].topic;
    channel = message.guild.channels.get(channel[0][0]);
    const embed = new RichEmbed({
      author: { name: message.author.username, icon_url: message.author.avatarURL },
      title: `${channelTopic} suggestion`,
      description: params.join(' '),
      timestamp: Date.now()
    });
    const sMessage = await channel.send(embed);
    embed.setFooter(`#${sMessage.id}`);
    await sMessage.edit(embed);
    for (let r of reactions) {
      await sMessage.react(r);
    }
    await message.delete();
  } else {
    await message.channel.send(`Sorry there is no suggestion channel for that gamemode`);
  }
}

exports.name = 'suggest';
exports.call = call;
