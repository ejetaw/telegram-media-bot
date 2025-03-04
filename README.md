# Telegram Media Streaming Bot

A Telegram bot that can stream media content from various sources.

## Features

- Stream YouTube videos directly to Telegram
- Extract audio from YouTube videos
- Automatically detect YouTube links in chat

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Telegram Bot Token:
   ```
   BOT_TOKEN=your_telegram_bot_token_here
   ```
4. Start the bot:
   ```
   npm start
   ```
   
   For development with the example token:
   ```
   npm run dev
   ```

## Getting a Telegram Bot Token

1. Talk to [@BotFather](https://t.me/botfather) on Telegram
2. Send the command `/newbot`
3. Follow the instructions to create a new bot
4. BotFather will give you a token - copy this to your `.env` file

### Important: Valid Token Format

Your token should look something like:
```
1234567890:ABCDefGhIJKlmnOPQrsTUVwxyZ
```

Make sure to replace the placeholder in the `.env` file with your actual token.

## Commands

- `/start` - Welcome message and bot information
- `/help` - Show available commands
- `/youtube [URL]` - Stream a YouTube video
- `/audio [URL]` - Extract audio from a YouTube video

## Requirements

- Node.js v14 or higher
- FFmpeg (for audio processing)

### Installing FFmpeg

#### On Ubuntu/Debian:
```
sudo apt update
sudo apt install ffmpeg
```

#### On macOS (using Homebrew):
```
brew install ffmpeg
```

#### On Windows:
1. Download from [FFmpeg official website](https://ffmpeg.org/download.html)
2. Add FFmpeg to your PATH environment variable

## Development Mode

For development purposes, you can run the bot with:
```
npm run dev
```

This will allow the bot to start with the example token for testing purposes. Note that the bot won't be able to connect to the Telegram API with this token, but it will allow you to test other functionality.

## Troubleshooting

If you see an error like `404: Not Found` when starting the bot, it means your Telegram Bot Token is invalid or not properly configured. Check that:

1. You've created a bot with @BotFather
2. You've copied the correct token to your `.env` file
3. The token format is correct (should look like `1234567890:ABCDefGhIJKlmnOPQrsTUVwxyZ`)

If audio extraction doesn't work, make sure FFmpeg is installed and available in your PATH.

## License

MIT