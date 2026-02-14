# School Transport System

A comprehensive school transportation management system built with Next.js, Prisma, and PostgreSQL. Manage your school's bus fleet, drivers, students, expenses, and more.

## Features

- **Fleet Management** - Track buses, ownership types (school/private), documents, and maintenance schedules
- **Driver Management** - Manage drivers and conductors with license tracking and document management
- **Student Management** - Assign students to buses, track fees, and manage capacity
- **Route Management** - Create routes, assign buses and drivers per academic term
- **Expense Tracking** - Log and categorize expenses (Fuel, Maintenance, Salary, Insurance)
- **Fuel Inventory** - Track fuel purchases, dispenses, and calculate efficiency
- **Payment Collection** - Quarterly fee collection with receipt generation
- **Alerts & Reminders** - License expiry, insurance renewal, and fitness certificate alerts
- **Analytics** - Cost per kilometer, fuel efficiency, monthly expense comparisons
- **Bus Owner Payments** - Track payments to private bus owners

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based with bcrypt password hashing
- **Validation**: Zod
- **Testing**: Jest + React Testing Library
- **PDF Export**: jsPDF

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd school-transport-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` and set the required values:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/school_transport"
JWT_SECRET="your-secure-secret-key"

# Optional
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**: Generate a secure JWT secret for production:
```bash
openssl rand -base64 32
```

### 4. Set up the database

```bash
# Push schema to database
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
school-transport-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── fleet/         # Fleet management
│   │   │   ├── drivers/       # Driver management
│   │   │   ├── students/      # Student management
│   │   │   ├── payments/      # Payment collection
│   │   │   ├── expenses/      # Expense tracking
│   │   │   ├── fuel/          # Fuel inventory
│   │   │   ├── routes/        # Route management
│   │   │   └── alerts/        # Alerts & reminders
│   │   ├── (pages)/           # Page components
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   ├── lib/
│   │   ├── services/          # Business logic
│   │   │   ├── analytics.ts   # Fuel & cost analytics
│   │   │   ├── alerts.ts      # Alert management
│   │   │   └── fleet.ts       # Fleet operations
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── auth-edge.ts       # Edge-compatible auth
│   │   ├── logger.ts          # Structured logging
│   │   ├── rate-limit.ts      # Rate limiting
│   │   ├── validations.ts     # Zod schemas
│   │   └── prisma.ts          # Prisma client
│   └── __tests__/             # Test files
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── scripts/                   # Utility scripts
└── public/                    # Static assets
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

### Authentication

All API routes (except `/api/auth/login` and `/api/auth/register`) require authentication via JWT cookie.

```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

### Rate Limiting

Authentication endpoints are rate limited:
- Login: 5 attempts per 15 minutes
- Registration: 3 attempts per hour
- General API: 100 requests per minute

## Database Schema

Key models:

- **Bus** - Fleet vehicles with ownership, capacity, and documents
- **Driver** - Drivers/conductors with license tracking
- **Student** - Students with bus assignments and fee tracking
- **Route** - Transportation routes
- **BusRoute** - Bus-route assignments per academic term
- **Expense** - Expense records by category
- **Payment** - Fee payments with receipt numbers
- **Reminder** - Expiry alerts for licenses, insurance, etc.
- **FuelPurchase/FuelDispense** - Fuel inventory management

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with HTTP-only cookies
- **Input Validation**: Zod schema validation on all endpoints
- **Rate Limiting**: Protection against brute force attacks
- **Environment Variables**: Secrets never committed to code

## Testing

Run the test suite:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables for Production

Ensure these are set in your production environment:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure random string (32+ characters)
- `NODE_ENV=production`

### Docker (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and feature requests, please create an issue in the repository .
