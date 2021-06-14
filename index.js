// AOE2 Taunt Discord Bot using Node.js
// By: Zachery Paterson
// This bot is designed to be lightweight and easily implementable in any discord server.
// If you would like to modify the bot to have additional voicelines, simply add the named .ogg file (or other audio extension)
// to the taunt-string.json with an associative key (what you type to make the bot say it) and add the file its named after
// to the /taunts folder (or wherever else you've stored the files)
// *remember to change the "taunt-string" to reflect the name of the folder that audio files are stored in. If you add more id-based files
//  or add string-based id's
// you need to remove the '&& command.isTaunt' function from line 25 and adjust the length of commands
const Discord = require("discord.js");
const config = require("./config.json");
const fs = require("fs");
const pagination = require('discord.js-pagination');
const tauntJson = require("./taunt-string.json");
const { Console, exception } = require("console");
const client = new Discord.Client();
client.login(config.BOT_TOKEN);
const tauntString = "./taunts/"; // folder containing the .ogg files
let voiceChannel;
let taunts;
let configFile;
let directory;
let tauntList = [];
let prefix = ""; // prefix is saved to a json
loadTaunts();
loadConfig();
client.on("message", function(message){
  if (message.author.bot || !message.content.startsWith(prefix)) { return; }
  const command = message.content.slice(prefix.length); // remove the prefix
  if (command == "help"){
    pagination(message, loadHelp());
  }
  if (command.startsWith("prefix")){
    message.channel.send(changePrefix(command));
  }
  if (command.length < 3 && command.isTaunt()){ 
    if (message.member.voice.channel == null){
      message.channel.send("Must be in a voice channel to play taunts.");
      return;
    }
    try{
      voiceChannel = message.member.voice.channel;
      findTaunt(command).then(() =>{
        tauntList.push(directory);
      }).then(() => {playTaunts(voiceChannel);})
    }catch (err){
      message.channel.send(err);
    }
  } 
});
String.prototype.isTaunt = function(){return (/^\d+$/.test(this) && this > 0 && this < 43) ? true : false;}
async function findTaunt(id){
  for (var i in taunts){
    if (i == id.toString()){
      directory = tauntString + taunts[i-1].location;
    }
  }
}
async function playTaunts(newVoiceChannel){
  try{
    if (newVoiceChannel != undefined){
      voiceChanel = newVoiceChannel;
    }
    voiceChannel.join().then(connection =>{
      const dispatcher = connection.play(tauntList[0]);
      console.log("Played" + tauntList[0]);
      tauntList.removeAt(0);
      dispatcher.on("finish", () => {
        setTimeout(() => {(tauntList.length > 1) ? playTaunts() : voiceChannel.leave();}, 2000) 
      })
    }) 
    }catch (err){
      console.log("Error connecting to voice: ", err);
  }
}
function changePrefix(command){
  var newPrefix = command.slice(7);
  var msg;
  if (newPrefix.length == 1 || (newPrefix == "blank")){
    prefix = newPrefix;
    if (newPrefix == "blank"){
      prefix = "";
    }
    msg = "Prefix has been set to: <" + prefix.toString() + ">";
    msg += "If you would like to save the prefix for later, type <prefix save>"
  }
  else if (newPrefix == "save"){
    configFile.PREFIX = prefix;
    try{
      saveConfig();
      msg = "Prefix saved!";
    }catch(err){
      console.log("Error saving file to disk: ", err);
      msg = "Error saving file to disk.";
    }
  }
  else{
    msg = "Prefix has to be one character or set to <blank> or <space>.";
  }
  return msg;
}
function loadTaunts(){
  fs.readFile("./taunt-string.json", 'utf8', (err, jsonString) => {
    if (err) {
        console.log("Error reading file from disk: ", err);
        return;
    }
    try {
        taunts = JSON.parse(jsonString);
  } catch(err) {
        console.log('Error parsing JSON string:', err);
    }
  })
}
function loadConfig(){
  fs.readFile("./config.json", 'utf8', (err, jsonString) => {
    if (err) {
      console.log("Error reading file from disk: ", err);
      return;
    }
    try {
      configFile = JSON.parse(jsonString);
      prefix = configFile.PREFIX;
      console.log(configFile.PREFIX);
    } catch(err) {
          console.log("Error parsing JSON string: ", err);
    }
  })
}
function loadHelp(){
  var pages = [];
  console.log("made it");
  const helpPage = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('aoe2-taunt-bot Commands')
  .setDescription('List of all bot commands: ')
  .addFields(
    {name: "Current Prefix: ", value: (prefix == "") ? "blank" : prefix},
    {name: prefix + "help", value: "Opens this help menu"},
    {name: prefix + "prefix <option>", value: "Set a new prefix by adding a character in <option>.\nblank : for no prefix\nsave : to save the prefix to the bot."},
    {name: prefix + "<taunt number>", value: "List of all available taunts on the next pages.\nPress the arrows below to move between pages."}
  )
  pages.push(helpPage);
  var pageSize = 10;
  var pageNum = 1;
  while ((pageNum - 1) * pageSize < taunts.length)
  {
    const embedPage = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('aoe2-taunt-bot Commands')
    .setDescription('List of all taunts: ');
    for(var i = 0 + (pageSize * (pageNum - 1)); i < pageSize * pageNum; i++){
      if (taunts[i] == undefined){
        break;
      }
      var location = taunts[i].location.toString();
      location = location.slice(0, -4);
      
      var id = prefix + taunts[i].id.toString();
      embedPage.addField(id,location.split("_").join(" "));
    }
    pageNum++;
    pages.push(embedPage);
  }
  return pages;
}
function saveConfig(){
  fs.writeFile("./config.json", JSON.stringify(configFile), (err) => {
    if (err){
      throw err; 
    }
  })
}
Array.prototype.removeAt = function (iIndex){
  var vItem = this[iIndex];
  if (vItem) {
      this.splice(iIndex, 1);
  }
  return vItem;
};