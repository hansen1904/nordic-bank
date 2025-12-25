# Nordic Bank - Employee Dashboard

Modern employee-facing dashboard for Nordic Bank customer service operations.

## Features

- **Customer Management**: Search, view, and manage customer accounts
- **Account Overview**: Monitor account status, balances, and activity
- **Transaction Monitoring**: View and filter transaction history
- **Support Tools**: Customer issue tracking, guides, and knowledge base
- **Reports**: Generate analytics and performance reports
- **Internationalization**: Full support for Danish and English
- **Modern Design**: Nordic-inspired UI with glassmorphism effects

## Tech Stack

- **Framework**: Next.js 16.1.1
- **Language**: TypeScript 5
- **Internationalization**: next-intl 4.6.1
- **Icons**: lucide-react 0.562.0
- **Styling**: Custom CSS with Nordic design tokens

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
cd frontend/employee
npm install
```

### Development

Start the development server on port 3002:

```bash
npm run dev
```

The dashboard will be available at:
- English: http://localhost:3002/en
- Danish: http://localhost:3002/da

### Build

Build for production:

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Locale-specific pages
│   │   ├── customers/     # Customer management
│   │   ├── accounts/      # Account management
│   │   ├── transactions/  # Transaction monitoring
│   │   ├── support/       # Support tools
│   │   ├── reports/       # Reports & analytics
│   │   └── page.tsx       # Main dashboard
│   └── globals.css        # Global styles & design tokens
├── components/
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── dashboard/         # Dashboard components
│   └── customer/          # Customer components
├── i18n/                  # Internationalization config
├── lib/                   # Utilities and mock data
└── messages/              # Translation files (da.json, en.json)
```

## Key Features

### Dashboard
- Real-time metrics (customers served, pending tasks, active accounts)
- Customer search with autocomplete
- Quick actions panel
- Activity feed
- Top customers this week

### Customer Management
- Search customers by name, account number, or phone
- View detailed customer profiles
- Account overview per customer
- Transaction history

### Account Management
- List all accounts with filters
- Account status monitoring
- Balance tracking

### Transaction Monitoring
- View all transactions
- Filter by date, type, amount
- Transaction status tracking

### Support Tools
- Customer issue tracking
- Procedural guides
- Knowledge base search

## Design System

The dashboard uses Nordic Bank's design system with:
- Classic navy and slate color palette
- Inter font family
- Glassmorphism effects
- Responsive grid layouts
- Micro-interactions and hover effects

## Mock Data

For development purposes, the dashboard uses mock data defined in `src/lib/mock-data.ts`. This includes:
- Sample customers
- Account information
- Transaction history
- Activity feed data

In production, these will be replaced with API calls to the Go backend services.

## Future Enhancements

- Backend API integration (Go services)
- Employee authentication
- Real-time notifications
- Advanced reporting and analytics
- Customer support chat
- Account creation and management
- Transaction approval workflows

## License

This project is licensed under the GNU General Public License. See the [LICENSE](../../LICENSE) file for details.
