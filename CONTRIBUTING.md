# Contributing to ChatterBox

Thank you for your interest in contributing to ChatterBox! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/theognis1002/chatterbox.git
cd chatterbox
```
3. Install dependencies:
```bash
npm install
```
4. Create a new branch for your feature/fix:
```bash
git checkout -b feature/your-feature-name
```

## Development Workflow

1. Start the development server:
```bash
npm run dev
```
This will watch for changes and rebuild automatically.

2. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

3. Make your changes
4. Test thoroughly
5. Commit your changes with a descriptive message

## Project Structure

```
chatterbox/
├── src/
│   ├── background.ts        # Service worker - handles OpenAI API calls
│   ├── content.ts          # X/Twitter content script
│   ├── content_linkedin.ts # LinkedIn content script
│   ├── popup.ts           # Extension popup UI logic
│   ├── types.ts           # TypeScript definitions & default templates
│   ├── styles.css         # Extension styling with dark mode support
│   ├── utils/
│   │   └── promptLoader.ts # Loads system prompts from files
│   └── prompts/
│       └── default-system-prompt.txt # AI behavior instructions
├── dist/              # Built files (generated)
└── ...
```

## Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await for asynchronous operations
- Handle errors appropriately

## Commit Guidelines

Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

Example:
```
feat(templates): add custom template creation
fix(api): handle rate limit errors
docs(readme): update installation instructions
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the version number in package.json following [SemVer](https://semver.org/)
3. Ensure all tests pass and the extension works in Chrome
4. Link any related issues in the PR description
5. Request review from maintainers

## Adding New Features

### Templates
When adding new reply templates:
1. Add the template definition in `src/types.ts` (DEFAULT_TEMPLATES for X/Twitter)
2. For LinkedIn templates, update the linkedinTemplates array
3. Update the UI in `popup.html` for template management
4. Test template functionality with name placeholder replacement (LinkedIn)
5. Ensure templates work with the AI prompt system
6. Document the template behavior

### API Integration
When modifying OpenAI API-related code:
1. Update error handling in `background.ts` service worker
2. Test with various API responses and models (GPT-3.5, GPT-4, etc.)
3. Consider rate limiting and retry logic
4. Test message passing between content scripts and background
5. Verify Chrome storage integration for API keys and settings
6. Update relevant documentation

## Testing

Before submitting a PR:
1. Test the extension on both X/Twitter and LinkedIn platforms
2. Test X features: different tweet types (text, images, threads), reply generation, auto-like functionality
3. Test LinkedIn features: connection request notes, name extraction, template personalization
4. Verify error handling and retry logic
5. Check console for errors in both content scripts and background service worker
6. Test with and without API key
7. Verify settings persistence across Chrome sync storage
8. Test template management (add/edit/remove custom templates)
9. Test advanced settings (temperature, max tokens, typing speed, etc.)

## Bug Reports

When filing an issue:
1. Use the bug report template
2. Include Chrome version
3. Describe the expected vs actual behavior
4. Include any relevant console errors
5. List steps to reproduce
6. Add screenshots if applicable

## Feature Requests

When proposing new features:
1. Use the feature request template
2. Explain the use case
3. Describe expected behavior
4. Consider implementation complexity
5. Discuss potential alternatives

## Questions or Problems?

- Check existing issues first
- Use the discussions tab for general questions
- Join our community chat (if available)
- Contact maintainers directly for security issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
