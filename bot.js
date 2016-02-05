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
var http = require('http');

function handleRequest(request, response) {
    response.end('It works!');
}

var port = process.env.PORT? process.env.PORT: 8080;
var server = http.createServer(handleRequest);
server.listen(port, function() {
    console.log('Dummy HTTP server setup');
});

var controller = Botkit.slackbot({
    debug: false
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

function matchURL(text) {
    var matches = text.match(/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/ig)
    return (!matches || matches.length == 0)? undefined: matches[0].substr(0, matches[0].length - 1);
}

function summarizeURL(bot, message, channel, requesting_user) {
    var url = matchURL(message.text);
    if (!url) {
        console.log('No URL');
        return;
    }

    console.log('MESSAGE: ' + JSON.stringify(message));
    var api_url = 'http://api.smmry.com/&SM_LENGTH=5&SM_WITH_BREAK&SM_QUOTE_AVOID&SM_API_KEY=' + process.env.SMRRY_TOKEN + '&SM_URL=' + url
    request.post(api_url, function(error, response, body) {
        if (error) {
            console.log('SMRRY API Error: ' + error);
            return;
        }
        else {
            var data = JSON.parse(body);
            var title = data['sm_api_title'].replace(/\\"/g, '"').replace(/\\'/g, "'");
            var bot_text = 'Here\'s a TL;DR for "' + title + '" (requested by <@' + requesting_user + '>)';
            var summary = data['sm_api_content'];
            var sentences = summary.split('[BREAK]');
            var attachments = [];
            for (var i = 0; i < sentences.length - 1; i++) {
                attachments.push({
                    text: sentences[i]
                });
            }
            
            bot.say({
                text: bot_text,
                attachments: attachments,
                channel: channel
            });
        }
    });
}

controller.on('reaction_added', function(bot, message) {
    console.log(message);
    if (message.reaction != 'robot_face' || message.item.type != 'message') {
        return;
    }

    bot.api.reactions.list({'user': message.user, count: 2}, function(err, response) {
        if (err) {
            console.log('Slack reaction got error: ' + err);
            return;
        }

        for (var i = 0; i < response.items.length; i++) {
            var item = response.items[i];
            if (item.type == 'message' &&
                item.channel == message.item.channel) {
                var reaction_message = item.message;
                var reactions = reaction_message.reactions;
                console.log('GOT REACTION MESSAGE');
                for (var j = 0; j < reactions.length; j++) {
                    var reaction = reactions[j];
                    console.log('REACTION: ' + JSON.stringify(reaction));
                    if (reaction.name == 'robot_face' && reaction.count == 1) {
                        summarizeURL(bot, reaction_message, item.channel, message.user);
                        return;
                    }
                }
            }

        }
        console.log(response);
    });
});

/*controller.hears('', 'ambient', function(bot, message) {
    console.log(message);
});*/

