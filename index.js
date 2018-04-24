const Discord = require('discord.js')
const client = new Discord.Client()
const http = require('http');
const auth = require('./auth.json');

const URL = "http://us.patch.battle.net:1119/";
const VERSIONS = [
    {
        version: "Live",
        url_param: "wow"
    },
    {
        version: "PTR",
        url_param: "wowt"
    },
    {
        version: "Beta",
        url_param: "wow_beta"
    }
];
const TARGET_CHANNEL = "automated-messages";
const DEBUG_CHANNEL = "purple-parlor";
let automatedMessage, purpleParlor;
const clients = {};

function fetchCDN() {
    purpleParlor.send("Fetching Blizzard CDN for new versions");
    VERSIONS.map(({url_param, version}) => {
        http.get(URL + url_param + "/versions", res => {
            let body = '';

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
                try {
                    purpleParlor.send(`Received results for ${version}`);
                    res = body.split('\n')[2];
                    const data = res.split("|");
                    const buildNumber = data[4];
                    const buildText = data[5].replace("." + buildNumber, "");

                    if (!clients[version]) {
                        purpleParlor.send(`Now observing CDN for client: ${version}. Current build: ${buildText} (${buildNumber})`);
                        clients[version] = {
                            buildNumber: buildNumber,
                            buildText: buildText,
                        }
                    }
                    else if (clients[version] && clients[version].buildNumber && clients[version].buildNumber < buildNumber) {
                        automatedMessage.send(`A new client build for ${version} was released on Blizzard's CDN: ${buildText} (${buildNumber})`);
                        clients[version] = {
                            buildNumber: buildNumber,
                            buildText: buildText,
                        };
                    }
                    else {
                        purpleParlor.send(`Now new client build found for ${version}.`);
                    }
                } catch (err) {
                    purpleParlor.send("ERROR: " + JSON.stringify(err));
                }
            }, err => purpleParlor.send("ERROR: " + JSON.stringify(err)));
        }, err => purpleParlor.send("ERROR: " + JSON.stringify(err)));
    })
}

client.on('ready', function () {
    client.channels.map(channel => {
        if (channel.name === TARGET_CHANNEL) {
            automatedMessage = client.channels.get(channel.id);
        }
        if(channel.name === DEBUG_CHANNEL) {
            purpleParlor = client.channels.get(channel.id);
            purpleParlor.send("Algalon bot started.");
        }
    });
    fetchCDN();
    setInterval(fetchCDN, 5 * 60 * 1000);
});

client.login(auth.token);
