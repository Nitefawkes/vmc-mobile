# Contributing to VMC Mobile

Thank you for your interest in contributing to VMC Mobile! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- For iOS development: macOS with Xcode
- For Android development: Android Studio and Android SDK

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vmc-mobile.git
   cd vmc-mobile
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

5. For iOS, install CocoaPods dependencies:
   ```bash
   cd ios && pod install && cd ..
   ```

## Development Workflow

### Branch Naming Convention

- Feature: `feature/description`
- Bug fix: `fix/description`
- Hotfix: `hotfix/description`
- Documentation: `docs/description`

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Run tests:
   ```bash
   npm test
   ```

4. Check code formatting:
   ```bash
   npm run lint
   npm run format
   ```

5. Commit your changes with a descriptive message:
   ```bash
   git commit -m "Add feature: description"
   ```

### Commit Message Guidelines

Follow the conventional commits specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add user authentication flow
fix: resolve crash on startup
docs: update README with installation steps
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types, avoid `any`
- Use interfaces for object shapes

### React/React Native

- Use functional components with hooks
- Follow React best practices
- Keep components small and focused
- Use meaningful component and variable names

### File Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── services/       # API and business logic
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── constants/      # App constants
└── assets/         # Images, fonts, etc.
```

## Testing

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Use React Native Testing Library
- Follow the AAA pattern (Arrange, Act, Assert)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update CHANGELOG.md if applicable
4. Create a Pull Request with a clear title and description
5. Link related issues
6. Wait for code review

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Commits follow commit message guidelines
- [ ] PR description clearly describes changes

## Code Review

- Be respectful and constructive
- Review code thoroughly
- Test the changes locally if possible
- Provide specific feedback
- Approve when satisfied

## Questions?

If you have questions, please:

1. Check existing documentation
2. Search existing issues
3. Create a new issue with the question label

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

Thank you for contributing! 🎉
