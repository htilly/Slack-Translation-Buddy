"use strict"

import { config } from './config';
import Translate from './modules/translate';
const translate = new Translate();


// Import the Real Time Messaging (RTM) client
// from the Slack API in node_modules
const RtmClient = require('@slack/client').RtmClient;

// The memory data store is a collection of useful functions we // can
// include in our RtmClient
const MemoryDataStore = require('@slack/client').MemoryDataStore;

// Import the RTM event constants from the Slack API
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

// Import the client event constants from the Slack API
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

const token = config.token;

// The Slack constructor takes 2 arguments:
// token - String representation of the Slack token
// opts - Objects with options for our implementation
let slack = new RtmClient(token, {
    // Sets the level of logging we require
    logLevel: 'info',
    // Initialize a data store for our client, this will
    // load additional helper functions for the storing
    // and retrieval of data
    dataStore: new MemoryDataStore(),
    // Boolean indicating whether Slack should automatically
    // reconnect after an error response
    autoReconnect: true,
    // Boolean indicating whether each message should be marked as // read
    // or not after it is processed
    autoMark: true
});

// Returns an array of all the channels the bot resides in
function getChannels(allChannels) {
    let channels = [];

    // Loop over all channels
    for (let id in allChannels) {
        // Get an individual channel
        let channel = allChannels[id];

        // Is this user a member of the channel?
        if (channel.is_member) {
            // If so, push it to the array
            channels.push(channel);
        }
    }

    return channels;
}

// Add an event listener for the RTM_CONNECTION_OPENED event,
//  which is called when the bot
// connects to a channel. The Slack API can subscribe to
// events by using the 'on' method
slack.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
    // Get the user's name
    let user = slack.dataStore.getUserById(slack.activeUserId);

    // Get the team's name
    let team = slack.dataStore.getTeamById(slack.activeTeamId);

    // Log the slack team name and the bot's name, using ES6's
    // template string syntax
    console.log(`Connected to ${team.name} as ${user.name}`);

    // Note how the dataStore object contains a list of all
    // channels available
    let channels = getChannels(slack.dataStore.channels);

    // Use Array.map to loop over every instance and return an
    // array of the names of each channel. Then chain Array.join
    // to convert the names array to a string
    let channelNames = channels.map((channel) => {
        return channel.name;
    }).join(', ');

    console.log(`Currently in: ${channelNames}`)
});


slack.on(RTM_EVENTS.MESSAGE, (message) => {
    let user = slack.dataStore.getUserById(message.user)

    if (user && user.is_bot) {
        return;
    }

    let channel = slack.dataStore.getChannelGroupOrDMById(message.channel);

    if (message.text) {
        let msg = message.text.toLowerCase();

        //Return false if message startswith "<" (This is probably a automated message)
        if ((msg.startsWith("&lt;")) || (msg.startsWith("<"))){
          return;
        }

        translate.autoToEnglish(msg)
            .then((result) => {
              if ((config.ignorelanguages == false) || (!config.ignorelanguages.includes(result.lang))) {
                //Create payload
                var payload = {
                  "id": 1,
                  "type": "message",
                  "channel": channel.id,
                  "text": user.real_name + ': ' + result.text + config.messagesuffix
                }

                //Check if it's a thread
                if (message.thread_ts != undefined){
                  //It's a thread. Include thread ts
                  payload['thread_ts'] = message.thread_ts;
                } else {
                  //create new thread if true.. Else a normal message will be sent
                  if (config.thread){
                    payload['thread_ts'] = message.ts;
                  }
                }

                //Send message
                slack.send(payload);
              }
            })
            .catch((err) => {
                console.log(err);
            })
    }
});

// Start the login process
slack.start();
