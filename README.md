# Twitter Reply Bot Chrome Extension

A Chrome extension that uses AI to generate contextual replies for Twitter/X comments. Select from different templates like questions, funny remarks, agreements, or insights to quickly craft engaging responses.

## Features

- 🤖 AI-powered reply generation using OpenAI's GPT-3.5
- 📝 Multiple reply templates (Question, Funny Remark, Agreement, Add Insight)
- 🎨 Clean UI that integrates seamlessly with Twitter's interface
- 🌓 Dark mode support
- ⚡ Fast response generation
- 🔒 Secure API key storage

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/twitter-reply-bot.git
cd twitter-reply-bot
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `reply-bot` directory

### Configuration

1. Click the extension icon in your Chrome toolbar
2. Enter your OpenAI API key
3. Click "Save API Key"

## Usage

1. Go to Twitter/X
2. Click "Reply" on any tweet
3. You'll see AI template buttons below the reply box
4. Click a template to generate a contextual reply
5. Edit the generated text as needed before posting

## Development

### Project Structure

```
reply-bot/
├── src/
│   ├── background.ts    # Service worker for API calls
│   ├── content.ts       # Content script for Twitter integration
│   ├── popup.ts         # Extension popup logic
│   ├── types.ts         # TypeScript type definitions
│   └── styles.css       # Extension styles
├── icons/               # Extension icons
├── dist/               # Built files (generated)
├── manifest.json       # Chrome extension manifest
├── popup.html          # Extension popup HTML
├── package.json        # Node dependencies
├── tsconfig.json       # TypeScript config
└── webpack.config.js   # Webpack bundler config
```

### Development Mode

To run in development mode with auto-reload:

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Templates

The extension includes 4 default templates:

1. **Question** - Generates thoughtful questions to engage with the tweet
2. **Funny Remark** - Creates witty and humorous responses
3. **Agreement** - Produces supportive replies that build on the original point
4. **Add Insight** - Generates responses that add valuable perspective

## Privacy & Security

- API keys are stored locally in Chrome's secure storage
- No data is sent to third parties except OpenAI for reply generation
- The extension only activates on Twitter/X domains

## Troubleshooting

### Extension not working?

1. Make sure you've entered a valid OpenAI API key
2. Check that you have credits in your OpenAI account
3. Refresh the Twitter page after installing the extension
4. Check the console for any error messages

### API Key Issues

- Ensure your API key starts with `sk-`
- Verify your OpenAI account has available credits
- Check that the API key has the necessary permissions

## Future Enhancements

- [ ] Support for GPT-4
- [ ] Custom template creation
- [ ] Reply history
- [ ] Sentiment analysis
- [ ] Multi-language support
- [ ] Thread continuation support

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT License - see LICENSE file for details

## Note on Icons

The current icons are placeholders. For production use, please create proper icon files in the following sizes:
- 16x16px (icon16.png)
- 48x48px (icon48.png)  
- 128x128px (icon128.png)

You can use tools like [Figma](https://figma.com) or [Canva](https://canva.com) to design your icons. 