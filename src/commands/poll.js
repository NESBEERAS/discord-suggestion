const { isPollWhitelisted } = require('../checks.js');
const { parseTime, isOfBaseType } = require('../util.js');
const Poll = require('../structs/Poll.js');

// Doesn't work with prefixes containing a space
const splitArgs = function(content) {
  const space = content.indexOf(' ');
  return space < 1 ? [] : content.substring(space+1).split(';');
}

const rawWrapper = function(key) {
  return function(value) {
    return { value, key };
  }
}

const timeWrapper = function(time) {
  return { value: parseTime(time), key: 'duration' };
}

const numberWrapper = function(key) {
  return function(value) {
    return { value: Number(value), key };
  }
}

const OPTIONS = {
  time: timeWrapper,
  duration: timeWrapper,
  title: rawWrapper('title'),
  color: numberWrapper('color')
}

const parseArgs = function(content) {
  const parts = splitArgs(content);
  const partsL = parts.length;
  const res = {
    title: 'Poll',
    description: null,
    options: [],
    duration: null,
    color: undefined
  };
  for (let i=0;i<partsL;i++) {
    const opt = parts[i].match(/^([a-z-]+)=(.+)$/i);
    if (opt === null) {
      const value = parts[i].trim();
      if (value.length > 0) {
        if (res.description === null) {
          res.description = value;
        } else {
          res.options.push(value);
        }
      }
    } else {
      const t = opt[1].toLowerCase();
      if (t in OPTIONS) {
        const { value, key } = OPTIONS[t](opt[2]);
        res[key] = value;
      }
    }
  }
  return res;
}

const CHECKS = {
  description: {
    check: function(value) {
      return isOfBaseType(value, String) && value.length > 0;
    },
    error: 'Your description must be longer than 0 characters'
  },
  options: {
    check: function(value) {
      return (value instanceof Array) && value.length > 0;
    },
    error: 'You must have at least 1 option'
  },
  duration: {
    check: function(value) {
      return !isNaN(value) && value > 0;
    },
    error: 'You must provide a valid time greater than 1ms'
  },
  title: {
    check: function(value) {
      return isOfBaseType(value, String) && value.length > 0;
    },
    error: 'Your title must be longer than 0 characters'
  }
}

const call = async function(message) {
  const args = parseArgs(message.content);
  for (let key in CHECKS) {
    if (!CHECKS[key].check(args[key])) return await message.channel.send(CHECKS[key].error);
  }
  args.channel = message.channel;
  const poll = new Poll(message.client, args);
  await poll.send();
  await poll.save();
}

exports.name = 'poll';
exports.call = call;
exports.check = isPollWhitelisted;
exports.help = 'Create a poll `{command} title;option;option;set=value`\n\
Seperate all arguments with a `;`\n\
The first non-setting argument is the description and the following are used as options (in order)\n\
Setting arguments are set using key=value e.g. `title=My poll`\n\
Valid setting arguments are:\n\
- time : number followed by size (week: w, day: d, hours: h, minutes: m, seconds: s) e.g. `time=1w 4d 2h` for 1 week 4 days and 2 hours\n\
- title : the title e.g. `title=My poll`\n\
- color : number for color e.g. `color=0xff0000` for red';