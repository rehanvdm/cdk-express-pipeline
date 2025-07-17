---
title: Contributing
description: How to contribute to CDK Express Pipeline
---

Contributions are welcome! This project is built using [projen](https://github.com/projen/projen), which provides a standardized project structure and development workflow.

### Project Structure

As a standard projen repository, this project follows established conventions for:
- Code organization and structure
- Testing frameworks and patterns
- Build and deployment pipelines
- Documentation standards

For more information about projen and its conventions, visit the [projen documentation](https://projen.io/).

### Tests

To speed up local testing, add this to the compiler options of the `tsconfig.dev.json` file:

```json
{
  "isolatedModules": true
}
```

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request from your feature branch to the `main` branch of the [cdk-express-pipeline repo](https://github.com/rehanvdm/cdk-express-pipeline)

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting