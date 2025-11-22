# School Transportation Management System

A comprehensive web-based dashboard to track school bus fleet expenses, manage drivers, and ensure vehicle compliance.

## Features

- **Dashboard Overview**: Real-time statistics showing total expenses, active buses, drivers, and critical alerts
- **Fleet Management**: View and manage all buses with status badges (Active, Maintenance, Retired)
- **Expense Tracking**: Log and categorize expenses (Fuel, Maintenance, Salary, Insurance, Other)
- **Cost Per Mile Calculation**: Automatic calculation of fuel efficiency based on odometer readings
- **Expiry Alerts**: Automatic tracking of driver licenses, insurance renewals, permits, and maintenance schedules
- **Route Management**: Assign buses and drivers to specific routes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Icons**: Lucide React

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- npm or yarn package manager

## Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd school-transport-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your database connection:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/school_transport?schema=public"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**:
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Push the schema to your database
   npx prisma db push

   # Seed the database with sample data
   npm run db:seed
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **buses**: Bus information (registration, chassis number, capacity, status)
- **drivers**: Driver details (name, license number, expiry date, contact)
- **expenses**: All expense records with category, amount, and optional odometer readings
- **routes**: Defined bus routes with start/end points and distances
- **bus_routes**: Junction table assigning buses and drivers to routes
- **reminders**: Upcoming expiry dates and maintenance schedules

## API Endpoints

### Fleet Management
- `GET /api/fleet/overview` - Get fleet statistics summary
- `GET /api/fleet/buses` - List all buses with details
- `GET /api/fleet/[busId]` - Get specific bus details

### Expense Management
- `POST /api/expenses/log` - Log a new expense
- `GET /api/expenses/log` - Get expenses (with optional filters)
- `GET /api/expenses/aggregate` - Get aggregated expense data by category
- `GET /api/expenses/cost-per-mile` - Calculate cost per mile/km

### Alerts & Reminders
- `GET /api/alerts` - Get all upcoming alerts and expiries
- `POST /api/alerts/resolve` - Mark a reminder as resolved

## Core Business Logic

### Cost Per Mile Calculation
Located in `src/lib/services/analytics.ts`:
- Calculates efficiency as: Total Fuel Cost / Total Distance Traveled
- Uses odometer readings from fuel expense logs
- Tracks calculation period

### Expiry Alerts
Located in `src/lib/services/alerts.ts`:
- Checks driver license expiries within 30 days
- Monitors bus-related renewals (insurance, permits, fitness certificates)
- Categorizes alerts by severity (critical, warning, info)

### Expense Aggregation
Located in `src/lib/services/analytics.ts`:
- Groups expenses by category
- Compares monthly expenses with previous periods
- Calculates percentage changes

## Project Structure

```
school-transport-system/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data
├── src/
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   │   ├── fleet/
│   │   │   ├── expenses/
│   │   │   └── alerts/
│   │   ├── fleet/             # Fleet management page
│   │   ├── expenses/          # Expense tracking page
│   │   ├── alerts/            # Alerts page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Dashboard home
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── Navigation.tsx
│   │   ├── DashboardContent.tsx
│   │   ├── FleetTable.tsx
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseList.tsx
│   │   ├── AlertCard.tsx
│   │   └── StatCard.tsx
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       └── services/          # Business logic
│           ├── analytics.ts
│           ├── alerts.ts
│           └── fleet.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Usage Guide

### Logging a Fuel Expense

1. Navigate to the **Expenses** page
2. Select the bus from the dropdown
3. Choose "Fuel" as the category
4. Enter the amount, date, and odometer reading
5. Optionally upload a receipt image
6. Click "Log Expense"

### Viewing Fleet Status

1. Navigate to the **Fleet** page
2. View all buses with their current status
3. See assigned routes and drivers
4. Check for pending alerts

### Monitoring Alerts

1. Navigate to the **Alerts** page
2. View critical, warning, and info-level alerts
3. See days remaining for each expiry
4. Take action on upcoming renewals

## Database Commands

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Create a new migration
npm run db:migrate

# Reset database and re-seed
npx prisma migrate reset
```

## Production Deployment

1. Set up a PostgreSQL database (e.g., on Supabase, Railway, or AWS RDS)
2. Configure environment variables for production
3. Build the application:
   ```bash
   npm run build
   ```
4. Start the production server:
   ```bash
   npm start
   ```

## Future Enhancements

- Student attendance tracking
- GPS tracking integration
- Mobile app for drivers
- SMS/Email notifications for alerts
- Advanced reporting and analytics
- Role-based access control

## License

This project is proprietary software for school transportation management.

## Support

For issues or questions, please contact your system administrator.
