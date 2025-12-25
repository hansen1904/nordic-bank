// Mock data for employee dashboard development

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    accountNumber: string;
    balance: number;
    status: 'active' | 'inactive';
    joinDate: Date;
}

export interface Account {
    id: string;
    customerId: string;
    accountNumber: string;
    type: 'checking' | 'savings';
    balance: number;
    currency: string;
    status: 'active' | 'frozen' | 'closed';
}

export interface Transaction {
    id: string;
    accountId: string;
    type: 'deposit' | 'withdrawal' | 'transfer';
    amount: number;
    description: string;
    date: Date;
    status: 'completed' | 'pending' | 'failed';
}

export interface Activity {
    id: string;
    type: 'comment' | 'approval' | 'status_change' | 'report';
    title: string;
    description: string;
    timestamp: Date;
}

// Mock Customers
export const mockCustomers: Customer[] = [
    {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+4512345678',
        accountNumber: '12345678901234',
        balance: 125000,
        status: 'active',
        joinDate: new Date('2023-01-15'),
    },
    {
        id: '2',
        name: 'James Lee',
        email: 'james.lee@example.com',
        phone: '+4523456789',
        accountNumber: '23456789012345',
        balance: 89500,
        status: 'active',
        joinDate: new Date('2023-03-22'),
    },
    {
        id: '3',
        name: 'Emma Thompson',
        email: 'emma.thompson@example.com',
        phone: '+4534567890',
        accountNumber: '34567890123456',
        balance: 205000,
        status: 'active',
        joinDate: new Date('2022-11-08'),
    },
    {
        id: '4',
        name: 'Rajesh Patel',
        email: 'rajesh.patel@example.com',
        phone: '+4545678901',
        accountNumber: '45678901234567',
        balance: 67800,
        status: 'active',
        joinDate: new Date('2023-06-12'),
    },
    {
        id: '5',
        name: 'Olivia Chen',
        email: 'olivia.chen@example.com',
        phone: '+4556789012',
        accountNumber: '56789012345678',
        balance: 142000,
        status: 'active',
        joinDate: new Date('2023-02-28'),
    },
];

// Mock Accounts
export const mockAccounts: Account[] = [
    {
        id: 'acc1',
        customerId: '1',
        accountNumber: '12345678901234',
        type: 'checking',
        balance: 125000,
        currency: 'DKK',
        status: 'active',
    },
    {
        id: 'acc2',
        customerId: '2',
        accountNumber: '23456789012345',
        type: 'savings',
        balance: 89500,
        currency: 'DKK',
        status: 'active',
    },
    {
        id: 'acc3',
        customerId: '3',
        accountNumber: '34567890123456',
        type: 'checking',
        balance: 205000,
        currency: 'DKK',
        status: 'active',
    },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
    {
        id: 'tx1',
        accountId: 'acc1',
        type: 'deposit',
        amount: 5000,
        description: 'Salary deposit',
        date: new Date('2025-12-20'),
        status: 'completed',
    },
    {
        id: 'tx2',
        accountId: 'acc1',
        type: 'withdrawal',
        amount: 1200,
        description: 'ATM withdrawal',
        date: new Date('2025-12-22'),
        status: 'completed',
    },
    {
        id: 'tx3',
        accountId: 'acc2',
        type: 'transfer',
        amount: 3000,
        description: 'Transfer to savings',
        date: new Date('2025-12-23'),
        status: 'completed',
    },
    {
        id: 'tx4',
        accountId: 'acc3',
        type: 'deposit',
        amount: 15000,
        description: 'Business income',
        date: new Date('2025-12-24'),
        status: 'completed',
    },
];

// Mock Activity Feed
export const mockActivities: Activity[] = [
    {
        id: 'act1',
        type: 'comment',
        title: 'Jane Smith commented on the AI-Powered Credit Risk Assessment',
        description: 'business need',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
        id: 'act2',
        type: 'status_change',
        title: 'Challenge Open Banking API Integration moved to Scouting phase',
        description: '',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    },
    {
        id: 'act3',
        type: 'approval',
        title: 'Sarah Johnson approved 3 startup matches',
        description: 'for the ESG Reporting Automation challenge',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
    },
    {
        id: 'act4',
        type: 'report',
        title: 'Monthly innovation report generated and ready for review',
        description: '',
        timestamp: new Date(Date.now() - 14400000), // 4 hours ago
    },
];

// Mock Dashboard Metrics
export const mockDashboardMetrics = {
    customersServedToday: 23,
    pendingTasks: 8,
    activeAccounts: 1247,
    totalTransactions: 342,
};

// Mock Top Customers (for this week)
export const mockTopCustomers = [
    { ...mockCustomers[0], transactionCount: 8 },
    { ...mockCustomers[1], transactionCount: 7 },
    { ...mockCustomers[2], transactionCount: 6 },
    { ...mockCustomers[3], transactionCount: 5 },
    { ...mockCustomers[4], transactionCount: 4 },
];
