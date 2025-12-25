# Nordic Bank

Welcome to Nordic Bank! This repository contains the source code for Nordic Bank's core banking system. Our goal is to provide secure, efficient, and user-friendly banking services.

## About

Nordic Bank is a modern banking platform designed to meet the financial needs of individuals and businesses. We offer a wide range of services including savings accounts, loans, investment options, and more.

## Getting Started / Installation

Go to the folder docs and find [getting started](docs/getting-started.md) markdown.

## Frontend

Nordic Bank has two frontend applications:

### Customer Frontend

The customer-facing frontend is built with Next.js 16 and located in `frontend/customer/`.

#### Development

```bash
cd frontend/customer
npm install
npm run dev
```

The customer frontend will be available at `http://localhost:3001`.

#### Features

- **Internationalization**: Supports Danish and English with automatic browser language detection
- **Modern Design**: Nordic-inspired UI with glassmorphism effects
- **Pages**: Landing page, Login (Coming Soon state)

### Employee Dashboard

The employee-facing dashboard is built with Next.js 16 and located in `frontend/employee/`.

#### Development

```bash
cd frontend/employee
npm install
npm run dev
```

The employee dashboard will be available at `http://localhost:3002`.

#### Features

- **Customer Management**: Search, view, and manage customer accounts
- **Account Overview**: Monitor account status, balances, and activity
- **Transaction Monitoring**: View and filter transaction history
- **Support Tools**: Customer issue tracking, guides, and knowledge base
- **Reports**: Generate analytics and performance reports
- **Internationalization**: Full support for Danish and English
- **Modern Design**: Nordic-inspired UI matching the customer frontend

See [frontend/employee/README.md](frontend/employee/README.md) for detailed documentation.

### Testing

Both frontends can be verified by running the build command:

The frontend includes automated testing with Jest and React Testing Library:

```bash
cd frontend/customer
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

**CI/CD Pipeline**: Every push and pull request automatically runs:
- ESLint for code quality
- Jest test suite
- Production build verification

See `.github/workflows/frontend-customer-ci.yml` for the complete CI configuration.

## Tools

Below is a list of tools, that I am using for this project.

- [Architecture Decision Record](https://github.com/joelparkerhenderson/architecture-decision-record?tab=readme-ov-file)

## License

This project is licensed under the GNU general public license. See the [LICENSE](LICENSE) file for details.

Thank you for choosing Nordic Bank!