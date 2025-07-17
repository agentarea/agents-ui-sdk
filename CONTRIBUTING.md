# Contributing to AgentArea UI SDK

Thank you for your interest in contributing to the AgentArea UI SDK! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/agentarea-ui-sdk.git
   cd agentarea-ui-sdk
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Build Packages**
   ```bash
   pnpm build
   ```

4. **Start Development**
   ```bash
   pnpm dev
   ```

5. **Run Storybook**
   ```bash
   pnpm storybook
   ```

## 🏗️ Project Structure

```
├── packages/
│   ├── core/           # Protocol-agnostic runtime library
│   └── react/          # React UI components and hooks
├── stories/            # Storybook component documentation
├── examples/           # Example implementations
├── docs/               # Documentation
└── .github/            # GitHub Actions workflows
```

## 🔧 Development Workflow

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   pnpm build
   pnpm type-check
   pnpm test:build
   ```

4. **Update Storybook**
   - Add stories for new components
   - Update existing stories if needed
   ```bash
   pnpm storybook
   ```

### Code Style

- **TypeScript**: All code must be written in TypeScript
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Code formatting is handled automatically
- **Naming**: Use descriptive names and follow existing patterns

### Component Guidelines

1. **Accessibility First**
   - Include proper ARIA labels
   - Support keyboard navigation
   - Test with screen readers

2. **Composable Design**
   - Follow Radix UI patterns
   - Use compound components where appropriate
   - Support customization through props

3. **TypeScript**
   - Export all prop interfaces
   - Use generic types where appropriate
   - Document complex types

### Testing

Currently, we rely on:
- **Type checking**: `pnpm type-check`
- **Build testing**: `pnpm test:build`
- **Storybook**: Interactive testing and documentation

Future testing additions:
- Unit tests with Jest/Vitest
- Integration tests
- Visual regression tests

## 📝 Documentation

### Storybook Stories

Every component should have comprehensive Storybook stories:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { YourComponent } from '@agentarea/react'

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
  parameters: {
    docs: {
      description: {
        component: 'Description of your component',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // Default props
  },
}

export const Variant: Story = {
  args: {
    // Variant props
  },
}
```

### API Documentation

- Document all public APIs
- Include usage examples
- Explain complex concepts
- Update README.md for major changes

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, Node.js version, browser (if applicable)
6. **Code Sample**: Minimal code that reproduces the issue

## 💡 Feature Requests

For feature requests, please provide:

1. **Use Case**: Why is this feature needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: What alternatives have you considered?
4. **Examples**: Code examples or mockups if applicable

## 🔄 Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass
   - Update documentation
   - Add Storybook stories for new components
   - Follow the existing code style

2. **PR Description**
   - Clearly describe what the PR does
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

3. **Review Process**
   - PRs require at least one approval
   - Address all review feedback
   - Keep PRs focused and atomic

4. **After Approval**
   - PRs are merged by maintainers
   - Delete your feature branch after merge

## 📋 Commit Guidelines

We follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(react): add Block.Protocol component
fix(core): resolve connection timeout issue
docs: update installation instructions
```

## 🏷️ Release Process

Releases are automated through GitHub Actions:

1. **Version Bumping**
   ```bash
   pnpm version:patch  # Bug fixes
   pnpm version:minor  # New features
   pnpm version:major  # Breaking changes
   ```

2. **Tagging**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **Automated Release**
   - GitHub Actions builds and publishes packages
   - Creates GitHub release
   - Deploys updated documentation

## 🤝 Community Guidelines

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Remember that everyone is learning
- **Be Inclusive**: Welcome contributors of all backgrounds and skill levels

## 📞 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: Join our community chat
- **Email**: Reach out to maintainers directly

## 🙏 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special mentions in documentation

Thank you for contributing to AgentArea UI SDK! 🚀