/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify Slack bot token in environment');
    process.exit(1);
}
else if (!process.env.SMRRY_TOKEN) {
    console.log('Error: Specify SMRRY token in environment');
    process.exit(2);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var request = require('request');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

controller.hears
var url_regex = '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
controller.hears([url_regex], 'ambient', function(bot, message) {
    var matches = message.text.match(/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/ig)
    var url = matches[0].substr(0, matches[0].length - 1)
    var api_url = 'http://api.smmry.com/&SM_LENGTH=5&SM_WITH_BREAK&SM_QUOTE_AVOID&SM_API_KEY=' + process.env.SMRRY_TOKEN + '&SM_URL=' + url
    request.post(api_url, function(error, response, body) {
        if (error) {
            console.log('SMRRY API Error: ' + error);
            return;
        }
        else {
            var data = JSON.parse(body);
            var title = data['sm_api_title'].replace(/\\"/g, '"').replace(/\\'/g, "'");
            var bot_text = 'Here\'s a TL;DR for "' + title + '" (requested by <@' + message.user + '>)';
            var summary = data['sm_api_content'];
            var sentences = summary.split('[BREAK]');
            var attachments = [];
            for (var i = 0; i < sentences.length; i++) {
                attachments.push({
                    text: sentences[i]
                });
            }
            
            bot.say({
                text: bot_text,
                attachments: attachments,
                channel: message.channel
            });
        }
    });
});

/*controller.hears('', 'ambient', function(bot, message) {
    console.log(message);
});*/

