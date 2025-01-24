# Enterprise API Testing Framework

A production-ready TypeScript framework for enterprise-grade API testing, demonstrated through Spotify Web API integration. This framework showcases professional testing practices while providing a robust foundation for API test automation.

## 🎯 Core Features

- 🛡 **Robust HTTP Client**
  - Sophisticated retry logic with exponential backoff
  - Comprehensive error transformation
  - Request/response interceptors with logging
  - Automatic header management

- 🔐 **OAuth2 Authentication**
  - Automatic token refresh
  - Secure credential handling
  - Market-aware request handling
  - Type-safe configuration

- 📊 **Advanced Testing Infrastructure**
  - Jest integration testing suite
  - Custom matchers and assertions
  - Performance monitoring
  - Structured test organization

- 🧩 **Enterprise Architecture**
  - SOLID principles implementation
  - Repository pattern for services
  - Dependency injection
  - Type-safe contracts

## Architecture

### Core Components
```
src/
├── core/               # Framework foundation
│   ├── http/          # Smart HTTP client with retry logic
│   ├── auth/          # Authentication strategies
│   ├── config/        # Configuration management
│   └── logging/       # Structured logging implementation
├── services/          # API service abstractions
├── types/             # Type definitions
└── __tests__/         # Test suites
```

### Key Design Patterns

The framework implements several enterprise-level patterns:

- **Service Layer Pattern**: Clean API abstractions through base service class
- **Repository Pattern**: Encapsulated API interactions
- **Interceptor Chain**: Centralized request/response processing
- **Dependency Injection**: Testable and maintainable architecture

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Spotify API credentials

### Installation

```bash
npm install
npm run build
```

### Configuration

Create a `.env` file:
```ini
BASE_URL=https://api.spotify.com/v1
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
TIMEOUT=10000
RETRIES=3
```

### Running Tests

```bash
npm test           # Run all test suites
npm test:verbose   # Detailed output
npm test:coverage  # Generate coverage report
npm test:debug     # Debug mode with open handles
```

## Testing Philosophy

The framework demonstrates several key testing principles:

- **Contract Testing**: Validation against TypeScript interfaces
- **Error Handling**: Comprehensive 4xx/5xx response testing
- **Performance**: Response time monitoring and SLA validation
- **Security**: Authentication and authorization verification

### Quality Standards

The framework maintains high quality through:

- Strict TypeScript configuration
- Comprehensive error handling
- Detailed logging with sensitive data redaction
- Complete test coverage
- CI/CD readiness