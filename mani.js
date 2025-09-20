const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildWebhooks
  ]
});

const ChatSystem = require('./chat');
const chat = new ChatSystem();

const TARGET_CHANNEL_ID = "1412482863877849299";

const conversationHistories = new Map();

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  setTimeout(() => {
    const statuses = [
      { status: 'online', activity: { name: 'Study & chill with me!', type: 'PLAYING' } },
      { status: 'idle', activity: { name: 'Helping students study', type: 'PLAYING' } },
      { status: 'online', activity: { name: 'Relax and learn', type: 'STREAMING', url: 'https://twitch.tv/a4hx' } }
    ];

    function changeStatus() {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      client.user.setPresence({
        status: randomStatus.status,
        activities: [randomStatus.activity]
      });
      console.log(`🔄 Status set to: ${randomStatus.status} | Activity: ${randomStatus.activity.type} - ${randomStatus.activity.name}`);
    }

    changeStatus();
    setInterval(changeStatus, 21600000);
  }, 3000);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== TARGET_CHANNEL_ID) return;

  await message.channel.sendTyping();

  try {
    const userId = message.author.id;
    let history = conversationHistories.get(userId) || [];

    // Get last 6 lines of conversation
    const recentHistory = history.slice(-6);

    const reply = await chat.getResponse(message.content, { username: message.author.username }, recentHistory);

    if (reply) {
      history.push(`User: ${message.content}`);
      history.push(`Bot: ${reply}`);

      if (history.length > 12) {
        history = history.slice(history.length - 12);
      }
      conversationHistories.set(userId, history);

      await message.channel.send(reply);
    }
  } catch (err) {
    console.error("❌ AI error:", err);
    await message.channel.send("⚠️ Sorry, something went wrong. Please try again.");
  }
});

client.login(process.env.DISCORD_TOKEN);
// Compare this snippet from chat.js:
