# ChatterBox - Architecture & Development Notes

## Overview
A Chrome extension that generates AI-powered contextual replies for X/Twitter and LinkedIn using OpenAI's API. The extension supports multiple reply templates and includes sophisticated content injection mechanisms for both platforms.

## Key Architecture Components

### Core Files Structure
```
src/
├── background.ts        # Service worker - handles OpenAI API calls
├── content.ts          # X/Twitter content script
├── content_linkedin.ts # LinkedIn content script  
├── popup.ts           # Extension popup UI logic
├── types.ts           # TypeScript definitions & default templates
├── styles.css         # Extension styling with dark mode support
├── utils/
│   └── promptLoader.ts # Loads system prompts from files
└── prompts/
    └── default-system-prompt.txt # AI behavior instructions
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
'promote'     - 🚀 Promotes wraithscan.com
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

### OpenAI Communication
- **Background Script**: All API calls handled in service worker for security
- **Message Passing**: Chrome runtime messaging between content scripts and background
- **Retry Logic**: Built-in retry mechanism for connection failures
- **Error Handling**: User-friendly error messages for API failures

### Settings Storage
```typescript
// Chrome storage schema
{
  apiKey: string,
  model: string,              // Default: gpt-4o
  systemPrompt: string,       // Loaded from prompts/default-system-prompt.txt
  advancedSettings: {
    temperature: 0.7,         // Response randomness
    maxTokens: 50,           // Response length limit
    presencePenalty: 0.6,    // Topic diversity
    frequencyPenalty: 0.3,   // Repetition reduction
    typingSpeed: 5           // ms per character
  },
  templates: ReplyTemplate[],
  linkedinTemplates: ReplyTemplate[]
}
```

## UI Components

### Popup Interface
- **Tabbed Design**: General settings vs Templates management
- **Advanced Settings**: Collapsible section with AI parameters
- **Template Management**: Add/edit/remove custom templates per platform
- **Real-time Validation**: API key and model selection validation

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

### DOM Manipulation Challenges
- **X/Twitter**: Heavy use of React/virtual DOM requires careful element detection
- **LinkedIn**: SPA navigation requires URL change monitoring and state cleanup
- **Timing Issues**: MutationObserver and async DOM operations need retry logic

### Security & Privacy
- **API Keys**: Stored securely in Chrome sync storage
- **Permissions**: Minimal required permissions (`storage`, `activeTab`)
- **Host Permissions**: Limited to X/Twitter and LinkedIn domains
- **No Data Collection**: All processing happens client-side or with OpenAI

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

## Future Enhancement Areas

### Immediate Improvements
- [ ] Unit and integration testing framework
- [ ] Custom template creation UI improvements
- [ ] Better error recovery mechanisms
- [ ] Performance monitoring and optimization

### Feature Expansions
- [ ] Support for additional social platforms
- [ ] Non-OpenAI LLM integration
- [ ] Reply history and analytics
- [ ] Team/organization template sharing
- [ ] Advanced content analysis and suggestions

## Development Environment Setup
```bash
git clone <repo>
npm install
npm run dev          # Start development build
# Load unpacked extension from dist/ in Chrome
```

## Debugging Tips
- Enable Chrome DevTools for extension pages
- Check background service worker console for API errors
- Use content script console for DOM injection issues
- Verify manifest.json permissions for host access
- Monitor network tab for OpenAI API request/response details