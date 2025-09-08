# ChatterBox - Architecture & Development Notes

## Overview
A Chrome extension that generates AI-powered contextual replies for X/Twitter and LinkedIn using OpenRouter. The extension provides access to 300+ AI models from OpenAI, Anthropic, Google, Meta, and other providers through a single unified API, multiple reply templates, and sophisticated content injection mechanisms for both platforms.

## Key Architecture Components

### Core Files Structure
```
src/
├── background.ts        # Service worker - handles OpenRouter API calls
├── content.ts          # X/Twitter content script
├── content_linkedin.ts # LinkedIn content script  
├── popup.ts           # Extension popup UI logic
├── types.ts           # TypeScript definitions & default templates
├── styles.css         # Extension styling with dark mode support
├── utils/
│   └── promptLoader.ts # Loads system prompts from files
└── prompts/
    └── x-system-prompt.txt # AI behavior instructions
    └── linkedin-system-prompt.txt # AI behavior instructions  
```

### Build System
- **Webpack** with TypeScript compilation
- **Entry points**: Separate content scripts for X and LinkedIn
- **Output**: All files compiled to `dist/` directory
- **Build commands**: `npm run build` (production), `npm run dev` (watch mode)

## Content Script Architecture

### X/Twitter Integration (`content.ts`)
- **Injection Strategy**: Uses MutationObserver + focus event listeners
- **Detection**: Identifies reply text areas via `contenteditable` and `data-testid` attributes
- **Button Placement**: Injects after toolbar (`[data-testid="toolBar"]`)
- **Text Insertion**: Character-by-character typing simulation with configurable speed
- **Auto-like Feature**: Automatically likes posts when replying
- **Error Handling**: Robust recovery from stale DOM references during typing

### LinkedIn Integration (`content_linkedin.ts`)
- **Dual Functionality**: 
  - Connection request "Add a note" modal (`textarea#custom-message`)
  - Post comment replies (contenteditable areas with comment-related attributes)
- **Detection**: Multiple selectors for connection modals and post comment areas
- **Name Extraction**: Captures recipient name from button aria-labels or profile headers
- **Template System**: Separate template sets for connections vs post replies
- **Text Insertion**: Same robust character-by-character typing as X/Twitter with dynamic element re-discovery
- **Modal & SPA Handling**: URL change monitoring and proper cleanup for LinkedIn's navigation

## Template System

### X/Twitter Templates (10 default)
```typescript
// Located in types.ts - DEFAULT_TEMPLATES
'question'    - ❓ Thoughtful questions
'funny'       - 😄 Witty responses  
'agree'       - 👍 Supportive replies
'sarcastic'   - 🤨 Clever sarcasm
'insight'     - 💡 Technical insights
'disagree'    - 👎 Respectful disagreement
'congrats'    - 🎉 Congratulatory
'response'    - 💬 General responses
'encourage'   - 💪 Encouraging messages
```

### LinkedIn Templates
- **Connection Templates**: Static message templates with `{name}` personalization (stored as `linkedinTemplates`)
- **Post Reply Templates**: AI-generated contextual comments like X/Twitter (stored as `linkedinPostTemplates`)
- **Default LinkedIn Post Templates (6 types)**:
  ```typescript
  'professional' - 💼 Professional comments
  'insightful'   - 💡 Thoughtful insights  
  'supportive'   - 👏 Encouraging responses
  'question'     - ❓ Discussion starters
  'networking'   - 🤝 Relationship building
  'expertise'    - 🎓 Professional knowledge sharing
  ```

## API Integration

### OpenRouter Integration
- **Unified API Access**: Single endpoint for 300+ models from multiple providers
- **Model Variety**: Access to models from OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, and more
- **Simplified Parameters**: OpenRouter normalizes all models to use standard `max_tokens` parameter
- **Background Script**: All API calls handled in service worker for security  
- **Message Passing**: Chrome runtime messaging between content scripts and background
- **Retry Logic**: Built-in retry mechanism for connection failures
- **Error Handling**: User-friendly error messages for API failures

### Available Models
- **OpenAI**: GPT-5, GPT-4.1, GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku, Claude 4
- **Google**: Gemini Pro, Gemini Pro 1.5
- **Meta**: Llama 3.1 (8B, 70B, 405B variants)
- **Mistral**: Mixtral 8x7B mixture of experts
- **DeepSeek**: DeepSeek Chat model
- **Perplexity**: Sonar models with web search capabilities

### Settings Storage
```typescript
// Chrome storage schema
{
  openrouterApiKey: string,           // OpenRouter API key
  model: string,                      // Default: openai/gpt-4.1
  systemPrompt: string,               // Loaded from prompts/linkedin-system-prompt.txt 
  // & prompts/x-system-prompt.txt
  advancedSettings: {
    temperature: 0.5,                 // Response randomness
    maxTokens: 40,                   // Response length limit
    presencePenalty: 0.6,            // Topic diversity
    frequencyPenalty: 0.3,           // Repetition reduction
    typingSpeed: 5                   // ms per character
  },
  templates: ReplyTemplate[],
  linkedinTemplates: ReplyTemplate[],
  linkedinPostTemplates: ReplyTemplate[]
}
```

## UI Components

### Popup Interface
- **Single API Key Setup**: Simple OpenRouter API key configuration
- **Extensive Model Selection**: Choose from 300+ models across multiple providers
- **Tabbed Design**: General settings vs Templates management
- **Advanced Settings**: Collapsible section with AI parameters
- **Template Management**: Add/edit/remove custom templates per platform
- **Real-time Validation**: API key and model selection validation
- **Model Descriptions**: Helpful descriptions for each model option

### Injected Buttons
- **Styling**: Matches platform design language
- **Dark Mode**: Automatic detection and styling adjustment
- **Loading States**: Visual feedback during generation
- **Error States**: Clear error messaging

## Development Workflows

### Build Commands
```bash
npm run build     # Production build
npm run dev       # Development with watch mode
npm run clean     # Remove dist directory
npm run zip       # Package for Chrome Web Store
npm run package   # Full build pipeline
```

### Testing Strategy
- **Manual Testing**: No automated tests currently implemented
- **Browser Testing**: Load unpacked extension in Chrome developer mode
- **API Testing**: Verify OpenAI integration with various models

## Technical Considerations

### API Simplification
- **Unified Parameter Handling**: OpenRouter normalizes all models to use standard `max_tokens` parameter
- **No Model-Specific Compatibility**: OpenRouter handles all parameter compatibility internally
- **Simplified Integration**: Single API endpoint and parameter format for all 300+ models
- **Future-Proof Design**: New models automatically available through OpenRouter without code changes

### DOM Manipulation Challenges
- **X/Twitter**: Heavy use of React/virtual DOM requires careful element detection
- **LinkedIn**: SPA navigation requires URL change monitoring and state cleanup
- **Timing Issues**: MutationObserver and async DOM operations need retry logic

### Security & Privacy
- **API Keys**: Single OpenRouter API key stored securely in Chrome sync storage
- **Permissions**: Minimal required permissions (`storage`, `activeTab`)
- **Host Permissions**: Limited to X/Twitter and LinkedIn domains
- **No Data Collection**: All processing happens client-side or with OpenRouter
- **Provider Transparency**: OpenRouter provides transparent access to multiple AI providers

### Performance Optimizations
- **WeakSet Tracking**: Prevents duplicate button injection
- **Debounced Typing**: Configurable typing speed to avoid UI blocking
- **Memory Management**: Proper observer cleanup and event listener management

## Common Issues & Solutions

### Extension Context Errors
- **Problem**: Service worker disconnection during long operations
- **Solution**: Retry logic with user-friendly error messages

### Stale DOM References  
- **Problem**: React/SPA re-renders invalidate element references during typing
- **Solution**: Robust character-by-character typing with dynamic element re-discovery
  - Both X/Twitter and LinkedIn use the same approach:
    1. Re-find editable element on each character iteration  
    2. Validate element is still connected and editable
    3. Handle contenteditable vs textarea/input differences
    4. Graceful error handling if element disappears mid-typing
    5. Proper focus management and cursor positioning

### Template Persistence
- **Problem**: Templates not syncing across devices
- **Solution**: Chrome storage.sync API usage

### Contextual Content Detection (Critical for Multi-Post Feeds)
- **Problem**: Content detection methods that use global DOM queries will return stale/wrong post content when users scroll and interact with different posts
- **Root Cause**: Using `document.querySelectorAll()` globally returns the first match found, not the specific post being interacted with
- **Solution**: **ALWAYS** use contextual content detection for social media platforms:
  1. **Pass input element context**: Methods like `getPostContent()` must receive the specific input/reply element being used
  2. **Walk up DOM tree**: From the input element, traverse up to find the parent post container (e.g., `article`, `[role="listitem"]`, etc.)
  3. **Scoped content search**: Search for post content only within the identified post container, not globally
  4. **Platform-specific containers**: Each platform has different post container patterns:
     - X/Twitter: `article[data-testid="tweet"]`
     - LinkedIn: `[role="listitem"]`, `.feed-shared-update-v2`, `[componentkey*="activity"]`
  5. **Robust fallback**: Keep global search as fallback, but prioritize contextual detection
- **Example Fix**: LinkedIn `getLinkedInPostContent(inputElement)` walks up from comment input to find specific post container, then searches within that scope
- **Why Critical**: Without this approach, users get incorrect AI responses based on wrong post content, especially in infinite scroll feeds

## Recent Major Updates

### OpenRouter-Only Architecture (v1.1)
- **Simplified Integration**: Switched to OpenRouter exclusively for access to 300+ AI models
- **Single API Key**: Streamlined setup with just one OpenRouter API key needed
- **Universal Model Access**: GPT-5, Claude 4, Gemini Pro, Llama 3.1, and hundreds more models
- **Parameter Normalization**: OpenRouter handles all model-specific parameter compatibility
- **Enhanced Features**: Improved UI and streamlined settings

## Development Environment Setup
```bash
git clone <repo>
npm install
npm run dev          # Start development build
# Load unpacked extension from dist/ in Chrome
```
