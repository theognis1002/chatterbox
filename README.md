# X/X Reply Bot Chrome Extension

A Chrome extension that uses AI to generate contextual replies for X/X comments. Select from different templates like questions, funny remarks, agreements, or insights to quickly craft engaging responses.

## Features

- 🤖 AI-powered reply generation using OpenAI models (GPT-4, GPT-3.5-turbo, and more)
- 📝 Multiple reply templates (Question, Funny Remark, Agreement, Add Insight)
- 🎨 Clean UI that integrates seamlessly with X's interface
- 🌓 Dark mode support
- ⚡ Fast response generation
- 🔒 Secure API key storage
- ⚙️ Customizable system prompt
- 🎛️ Advanced AI parameter controls

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
3. (Optional) Select your preferred OpenAI model
4. (Optional) Customize the system prompt
5. (Optional) Adjust advanced settings:
   - Temperature (controls response randomness)
   - Max tokens (controls response length)
   - Presence penalty (encourages new topics)
   - Frequency penalty (reduces repetition)
6. Click "Save Settings"

## Usage

1. Go to X/X
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
│   ├── content.ts       # Content script for X integration
│   ├── popup.ts         # Extension popup logic
│   ├── types.ts         # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── prompts/        # System prompts
│   └── styles.css      # Extension styles
├── icons/              # Extension icons
├── dist/              # Built files (generated)
├── manifest.json      # Chrome extension manifest
├── popup.html         # Extension popup HTML
├── package.json       # Node dependencies
├── tsconfig.json      # TypeScript config
└── webpack.config.js  # Webpack bundler config
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
- Settings and preferences are stored locally
- No data is sent to third parties except OpenAI for reply generation
- The extension only activates on X/X domains

## Troubleshooting

### Extension not working?

1. Make sure you've entered a valid OpenAI API key
2. Check that you have credits in your OpenAI account
3. Verify your selected model is available on your OpenAI plan
4. Refresh the X page after installing the extension
5. Check the console for any error messages

### API Key Issues

- Ensure your API key starts with `sk-`
- Verify your OpenAI account has available credits
- Check that the API key has the necessary permissions
- Confirm your OpenAI plan supports the selected model

## Future Enhancements

- [ ] Custom template creation
- [ ] Reply history
- [ ] Sentiment analysis
- [ ] Multi-language support
- [ ] Thread continuation support
- [ ] Template-specific system prompts
- [ ] Custom model parameter presets

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