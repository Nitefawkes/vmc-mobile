# VMC Mobile

A modern React Native mobile application built with TypeScript, featuring a robust development setup with testing, linting, and CI/CD integration.

[![CI](https://github.com/Nitefawkes/vmc-mobile/workflows/CI/badge.svg)](https://github.com/Nitefawkes/vmc-mobile/actions)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.76.5-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)

## Features

- ✅ **React Native 0.76.5** - Latest stable version
- ✅ **TypeScript** - Full type safety and IntelliSense
- ✅ **ESLint & Prettier** - Code quality and formatting
- ✅ **Jest & React Native Testing Library** - Comprehensive testing setup
- ✅ **Path Aliases** - Clean imports with `@components`, `@screens`, etc.
- ✅ **Dark Mode Support** - Built-in theme switching
- ✅ **CI/CD Pipeline** - GitHub Actions for automated testing and builds
- ✅ **Pre-configured Project Structure** - Organized and scalable

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **React Native CLI**: `npm install -g react-native-cli`

### Platform-Specific Requirements

#### iOS Development

- **macOS** (required for iOS development)
- **Xcode** 14.0 or higher ([Download from App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **CocoaPods**: `sudo gem install cocoapods`
- **iOS Simulator** (included with Xcode)

#### Android Development

- **Android Studio** ([Download](https://developer.android.com/studio))
- **Android SDK** (API Level 31 or higher)
- **Java Development Kit (JDK)** 17
- **Android Emulator** or physical device

For detailed environment setup, see the [React Native Environment Setup Guide](https://reactnative.dev/docs/environment-setup).

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Nitefawkes/vmc-mobile.git
cd vmc-mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 5. Run the Application

#### iOS

```bash
npm run ios
# Or specify a device
npm run ios -- --simulator="iPhone 15 Pro"
```

#### Android

```bash
npm run android
# Make sure you have an emulator running or device connected
```

#### Start Metro Bundler (Optional)

```bash
npm start
```

## Project Structure

```
vmc-mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API calls and business logic
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # App constants and theme
│   └── assets/           # Images, fonts, icons
├── __tests__/            # Test files
├── android/              # Android native code
├── ios/                  # iOS native code
├── .github/              # GitHub Actions workflows
├── App.tsx               # Root component
├── index.js              # App entry point
└── package.json          # Dependencies and scripts
```

## Available Scripts

### Development

```bash
npm start                 # Start Metro bundler
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
```

### Testing

```bash
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript type checking
```

### Cleanup

```bash
npm run clean            # Clean all build artifacts
npm run clean:android    # Clean Android build
npm run clean:ios        # Clean iOS build
```

## Path Aliases

The project is configured with path aliases for cleaner imports:

```typescript
// Instead of this:
import { Button } from '../../../components/Button';

// Use this:
import { Button } from '@components/Button';
```

Available aliases:
- `@/*` - src directory
- `@components/*` - src/components
- `@screens/*` - src/screens
- `@navigation/*` - src/navigation
- `@services/*` - src/services
- `@hooks/*` - src/hooks
- `@utils/*` - src/utils
- `@types/*` - src/types
- `@constants/*` - src/constants
- `@assets/*` - src/assets

## Testing

The project uses Jest and React Native Testing Library for testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

Tests are located alongside their source files or in the `__tests__` directory.

Example test:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';

describe('HomeScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Welcome!')).toBeTruthy();
  });
});
```

## Code Style

This project enforces code quality through:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

Configuration files:
- `.eslintrc.js` - ESLint rules
- `.prettierrc.js` - Prettier formatting rules
- `tsconfig.json` - TypeScript configuration

## CI/CD

The project includes GitHub Actions workflows for continuous integration:

- **Automated Testing** - Runs on every push and pull request
- **Linting & Type Checking** - Ensures code quality
- **Build Verification** - Validates Android and iOS builds
- **Code Coverage** - Tracks test coverage

See `.github/workflows/ci.yml` for details.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Troubleshooting

### Common Issues

#### iOS Build Fails

```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

#### Android Build Fails

```bash
cd android
./gradlew clean
cd ..
npm run android
```

#### Metro Bundler Issues

```bash
npm start -- --reset-cache
```

#### Clear All Caches

```bash
npm run clean
npm install
cd ios && pod install && cd ..
npm start -- --reset-cache
```

### React Native Debugger

For debugging, you can use:
- **React Native Debugger** - Standalone debugger
- **Flipper** - Mobile app debugger
- **Chrome DevTools** - Browser-based debugging

## Learn More

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search [existing issues](https://github.com/Nitefawkes/vmc-mobile/issues)
3. Create a [new issue](https://github.com/Nitefawkes/vmc-mobile/issues/new/choose)

## Acknowledgments

Built with:
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

---

**Happy Coding! 🚀**