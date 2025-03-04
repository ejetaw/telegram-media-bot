require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');

// Check if FFmpeg is installed
function checkFFmpeg() {
  return new Promise((resolve, reject) => {
    exec('ffmpeg -version', (error) => {
      if (error) {
        console.warn('WARNING: FFmpeg is not installed or not in PATH. Audio extraction may not work properly.');
        console.warn('Please install FFmpeg to use the audio extraction feature.');
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Check if BOT_TOKEN is set and valid
function validateBotToken() {
  const token = process.env.BOT_TOKEN;
  
  // Check if token exists
  if (!token || token.trim() === '') {
    console.error('ERROR: Telegram Bot Token is not set.');
    console.error('Please update your .env file with a valid BOT_TOKEN.');
    console.error('See README.md for instructions on how to get a token from BotFather.');
    return false;
  }
  
  // Check if token is the default example token
  if (token === '123456789:EXAMPLE_TOKEN_FOR_DEVELOPMENT_ONLY') {
    console.warn('WARNING: You are using the example token. This will not work in production.');
    console.warn('Please update your .env file with your actual Telegram Bot Token from @BotFather.');
    
    // In development mode, we'll continue with the example token for testing
    if (process.env.NODE_ENV === 'development') {
      console.warn('Continuing in development mode with example token...');
      return true;
    } else {
      console.error('ERROR: Cannot use example token in production mode.');
      return false;
    }
  }
  
  // Basic format validation (simple check for the format: numbers:alphanumeric)
  const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
  if (!tokenRegex.test(token)) {
    console.error('ERROR: Invalid Telegram Bot Token format.');
    console.error('Token should look like: 1234567890:ABCDefGhIJKlmnOPQrsTUVwxyZ');
    return false;
  }
  
  return true;
}

// Validate the bot token
if (!validateBotToken()) {
  process.exit(1);
}

// Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Welcome message
bot.start((ctx) => {
  ctx.reply(
    'Welcome to the Media Streaming Bot! 🎬\n\n' +
    'Commands:\n' +
    '/youtube [URL] - Stream a YouTube video\n' +
    '/audio [URL] - Extract audio from YouTube\n' +
    '/help - Show this help message'
  );
});

// Help command
bot.help((ctx) => {
  ctx.reply(
    'Media Streaming Bot Commands:\n\n' +
    '/youtube [URL] - Stream a YouTube video\n' +
    '/audio [URL] - Extract audio from YouTube\n' +
    '/help - Show this help message'
  );
});

// YouTube video streaming
bot.command('youtube', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Please provide a YouTube URL. Example: /youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  }

  const url = args[1];
  
  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return ctx.reply('Invalid YouTube URL. Please provide a valid YouTube video link.');
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title;
    
    await ctx.reply(`Preparing to stream: ${videoTitle}\nPlease wait...`);

    // Get the best video format
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    
    // Download and send the video
    const videoPath = path.join(tempDir, `${Date.now()}.mp4`);
    const videoStream = ytdl(url, { format: format });
    
    const writeStream = fs.createWriteStream(videoPath);
    videoStream.pipe(writeStream);

    writeStream.on('finish', async () => {
      // Send the video
      await ctx.replyWithVideo({ source: videoPath }, { caption: videoTitle });
      
      // Clean up
      fs.unlinkSync(videoPath);
    });

    writeStream.on('error', (err) => {
      console.error('Error writing video:', err);
      ctx.reply('Sorry, there was an error processing the video.');
      
      // Clean up on error
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    });
  } catch (error) {
    console.error('YouTube command error:', error);
    ctx.reply('Sorry, there was an error processing your request.');
  }
});

// Audio extraction
bot.command('audio', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Please provide a YouTube URL. Example: /audio https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  }

  const url = args[1];
  
  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return ctx.reply('Invalid YouTube URL. Please provide a valid YouTube video link.');
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title;
    
    await ctx.reply(`Extracting audio from: ${videoTitle}\nPlease wait...`);

    // Download and convert to audio
    const audioPath = path.join(tempDir, `${Date.now()}.mp3`);
    
    ytdl(url, { quality: 'highestaudio' })
      .pipe(fs.createWriteStream(audioPath))
      .on('finish', async () => {
        // Send the audio
        await ctx.replyWithAudio({ source: audioPath }, { caption: videoTitle });
        
        // Clean up
        fs.unlinkSync(audioPath);
      })
      .on('error', (err) => {
        console.error('Error writing audio:', err);
        ctx.reply('Sorry, there was an error processing the audio.');
        
        // Clean up on error
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      });
  } catch (error) {
    console.error('Audio command error:', error);
    ctx.reply('Sorry, there was an error processing your request.');
  }
});

// Handle direct YouTube links
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  
  // Check if the message is a YouTube URL
  if (ytdl.validateURL(text)) {
    try {
      const info = await ytdl.getInfo(text);
      const videoTitle = info.videoDetails.title;
      
      // Ask user what they want to do with this link
      await ctx.reply(
        `I detected a YouTube link for: ${videoTitle}\n\n` +
        'What would you like to do?\n' +
        '1. Stream video (/youtube)\n' +
        '2. Extract audio (/audio)'
      );
    } catch (error) {
      console.error('YouTube link detection error:', error);
    }
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred while processing your request.');
});

// Start the bot with better error handling
async function startBot() {
  try {
    // Check for FFmpeg installation
    await checkFFmpeg();
    
    // Launch the bot
    await bot.launch();
    console.log('Media Streaming Bot is running!');
    console.log('Bot is ready to receive commands.');
  } catch (err) {
    console.error('Failed to start the bot:', err);
    if (err.message && err.message.includes('404: Not Found')) {
      console.error('ERROR: Invalid Telegram Bot Token. Please check your .env file.');
      console.error('Make sure you have created a bot with @BotFather and used the correct token.');
    }
    process.exit(1);
  }
}

startBot();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));