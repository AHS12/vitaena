# Contributing to Vitaena

Thank you for considering contributing to Vitaena! This document provides guidelines and information for contributors.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (Browser, OS, device type)
- **Screenshots** if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear title and detailed description**
- **Use case** explaining why this enhancement would be useful
- **Possible implementation** details if you have ideas

### Pull Requests

1. **Clone** the repository: `git clone https://github.com/ahs12/vitaena.git`
2. **Create a patch branch** from `main`: `git checkout -b patch/feature-name main`
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Ensure all tests pass**
6. **Update documentation** if needed
7. **Push** your branch: `git push origin patch/feature-name`
8. **Submit a pull request** against the `main` branch

## Development Setup

1. Clone the repository: `git clone https://github.com/ahs12/vitaena.git`
2. Install dependencies: `pnpm install`
3. If using Docker, copy the environment file: `cp .env.example .env`
4. Start the development server: `pnpm dev` (or `docker-compose up` for Docker)
5. Make your changes
6. Test your changes thoroughly
7. Submit a pull request following the guidelines above

## Coding Standards

- Follow the existing code style and conventions
- Use TypeScript with strict typing
- Use Tailwind CSS for all styling (avoid custom CSS files)
- Use Material UI (MUI) for all form components, inputs, buttons, and interactive elements
- Implement proper error handling for storage operations
- Use Zustand for state management with proper TypeScript types
- Create reusable components for resume sections
- Ensure accessibility compliance (ARIA labels, semantic HTML)
- Use pnpm for package management

### Code Style

We maintain consistent code style using ESLint and TypeScript:

```bash
# Check code style
pnpm lint

# Fix code style issues
pnpm lint:fix
```

## Testing

All contributions must include appropriate tests:

```bash
# Run all tests
pnpm test

# Run tests with watch mode
pnpm test:watch
```

### Writing Tests

- Write tests for new components and functionality
- Test both desktop and mobile views
- Test offline functionality
- Test PDF export feature where applicable

## Documentation

- Update documentation for new features
- Add inline documentation for complex methods
- Include usage examples where appropriate
- Update configuration examples when needed

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add modern template design
fix: resolve PDF export on mobile devices
docs: update installation instructions
test: add tests for resume data storage
refactor: improve offline detection
style: update dark mode styling
```

Prefix types:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `style:` Code style changes
- `chore:` Maintenance tasks

## Review Process

1. **Automated checks** must pass (tests, type checking, linting)
2. **Manual review** by maintainers
3. **Discussion** if changes are needed
4. **Approval** and merge

## Guidelines

- Follow the existing code style and conventions
- Use TypeScript with strict typing
- Test your changes on both desktop and mobile
- Ensure privacy features remain intact
- Add appropriate documentation for new features

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion

## Recognition

Contributors will be acknowledged in:

- **CHANGELOG.md** for their contributions
- **README.md** contributors section
- **GitHub contributors** page

Thank you for helping make Vitaena better! 🚀
