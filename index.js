const Discord = require('discord.js')
const client = new Discord.Client()
const http = require('http');
const auth = require('./auth.json');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'})
    ]
});

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
const TARGET_CHANNEL = "automated-messages"; // "automated-messages
var automatedMessage;
const clients = {};
const DEBUG = false;

function fetchCDN(){
    logger.log("info", "Fetching CDN")
  VERSIONS.map(({ url_param, version} ) => {
    http.get(URL + url_param + "/versions", res => {
      var body = '';

      res.on('data', function(chunk){
          body += chunk;
      });

      res.on('end', function(){
          logger.log("info", "Received results for", url_param, version)
          res = body.split('\n')[2];
          const data = res.split("|");
          const buildNumber = data[4];
          const buildText = data[5].replace("." + buildNumber, "");

          if(!clients[version]){
              logger.log("info", `Now observing new version ${version}. Current build: ${buildText} (${buildNumber})`, url_param, version)
            if(DEBUG) automatedMessage.send(`Now observing CDN for client: ${version}. Current build: ${buildText} (${buildNumber})`);
            clients[version] = {
              buildNumber: buildNumber,
              buildText: buildText,
            }
          }
          else if (clients[version] && clients[version].buildNumber && clients[version].buildNumber < buildNumber) {
              logger.log("info", `A new client build for ${version} was released on Blizzard's CDN: ${buildText} (${buildNumber})`);
            automatedMessage.send(`A new client build for ${version} was released on Blizzard's CDN: ${buildText} (${buildNumber})`);
            clients[version] = {
              buildNumber: buildNumber,
              buildText: buildText,
            };
          }
          else {
              logger.log("info", `Now new client build found for ${version}.`);
            if(DEBUG) automatedMessage.send(`Now new client build found for ${version}.`);
          }
      }, err => logger.log("error", "err"));
    }, err => logger.log("error", "err"));
  })
}

client.on('ready', function () {
    logger.log("info", "Bot ready");
  client.channels.map(channel => {
    if(channel.name ==  TARGET_CHANNEL){
      automatedMessage = client.channels.get(channel.id);
    };
  });
  fetchCDN();
  setInterval(fetchCDN, 5 * 60 * 1000);
})

client.login(auth.token)
