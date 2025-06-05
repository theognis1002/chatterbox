# Contributing to X Reply Bot

Thank you for your interest in contributing to X Reply Bot! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/twitter-reply-bot.git
cd twitter-reply-bot
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
reply-bot/
├── src/
│   ├── background.ts    # Service worker for API calls
│   ├── content.ts       # Content script for X integration
│   ├── popup.ts         # Extension popup logic
│   ├── types.ts         # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── prompts/        # System prompts
│   └── styles.css      # Extension styles
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
1. Add the template definition in `src/types.ts`
2. Update the UI in `popup.html`
3. Add any necessary prompt modifications
4. Document the template in README.md

### API Integration
When modifying API-related code:
1. Update error handling in `background.ts`
2. Test with various API responses
3. Consider rate limiting
4. Update relevant documentation

## Testing

Before submitting a PR:
1. Test the extension on both Twitter and X domains
2. Test with different tweet types (text, images, threads)
3. Verify error handling
4. Check console for errors
5. Test with and without API key
6. Verify settings persistence

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
