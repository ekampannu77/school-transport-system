# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Fleet Management Endpoints

### GET /api/fleet/overview
Get fleet overview statistics.

**Response:**
```json
{
  "buses": {
    "total": 3,
    "active": 2,
    "maintenance": 1,
    "retired": 0
  },
  "drivers": {
    "total": 3,
    "active": 3
  },
  "routes": {
    "total": 3
  },
  "expenses": {
    "thisMonth": 112700
  }
}
```

### GET /api/fleet/buses
List all buses with details.

**Response:**
```json
[
  {
    "id": "clxxx...",
    "registrationNumber": "DL-01-AB-1234",
    "chassisNumber": "CH123456789",
    "seatingCapacity": 40,
    "status": "active",
    "purchaseDate": "2020-01-15T00:00:00.000Z",
    "_count": {
      "expenses": 5,
      "reminders": 2
    },
    "busRoutes": [
      {
        "driver": { "name": "Rajesh Kumar" },
        "route": { "routeName": "North Delhi Circuit" }
      }
    ]
  }
]
```

### GET /api/fleet/[busId]
Get specific bus details including expenses and reminders.

**Response:**
```json
{
  "id": "clxxx...",
  "registrationNumber": "DL-01-AB-1234",
  "chassisNumber": "CH123456789",
  "seatingCapacity": 40,
  "status": "active",
  "totalExpenses": 82300,
  "expenses": [...],
  "busRoutes": [...],
  "reminders": [...]
}
```

## Expense Management Endpoints

### POST /api/expenses/log
Log a new expense.

**Request Body:**
```json
{
  "busId": "clxxx...",
  "category": "Fuel",
  "amount": 4500,
  "date": "2024-01-15",
  "description": "Diesel fill-up",
  "odometerReading": 45000,
  "receiptImageUrl": "https://..."
}
```

**Validation:**
- `busId` (required): Valid bus ID
- `category` (required): One of: Fuel, Maintenance, Salary, Insurance, Other
- `amount` (required): Number
- `date` (required): ISO date string
- `odometerReading` (optional): Number (recommended for Fuel category)
- `receiptImageUrl` (optional): String

**Response:**
```json
{
  "id": "clyyy...",
  "busId": "clxxx...",
  "category": "Fuel",
  "amount": 4500,
  "date": "2024-01-15T00:00:00.000Z",
  "description": "Diesel fill-up",
  "odometerReading": 45000,
  "bus": {
    "registrationNumber": "DL-01-AB-1234"
  }
}
```

### GET /api/expenses/log
Get expenses with optional filters.

**Query Parameters:**
- `busId`: Filter by bus ID
- `category`: Filter by expense category
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)

**Example:**
```
GET /api/expenses/log?category=Fuel&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
[
  {
    "id": "clyyy...",
    "category": "Fuel",
    "amount": 4500,
    "date": "2024-01-15T00:00:00.000Z",
    "description": "Diesel fill-up",
    "odometerReading": 45000,
    "bus": {
      "registrationNumber": "DL-01-AB-1234"
    }
  }
]
```

### GET /api/expenses/aggregate
Get aggregated expense data by category.

**Query Parameters:**
- `startDate`: Start date for aggregation (ISO format)
- `endDate`: End date for aggregation (ISO format)
- `year`: Year for monthly comparison
- `month`: Month for monthly comparison (1-12)

**Example 1: Aggregate by date range**
```
GET /api/expenses/aggregate?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "total": 112700,
  "byCategory": {
    "Fuel": 13200,
    "Maintenance": 17500,
    "Salary": 50000,
    "Insurance": 35000,
    "Other": 0
  },
  "count": 8
}
```

**Example 2: Monthly comparison**
```
GET /api/expenses/aggregate?year=2024&month=1
```

**Response:**
```json
{
  "current": {
    "total": 112700,
    "byCategory": {...},
    "count": 8
  },
  "previous": {
    "total": 95000,
    "byCategory": {...},
    "count": 7
  },
  "percentageChange": 18.63
}
```

### GET /api/expenses/cost-per-mile
Calculate cost per mile/km based on fuel expenses and odometer readings.

**Query Parameters:**
- `busId`: (optional) Calculate for specific bus. If omitted, returns data for all buses.

**Example:**
```
GET /api/expenses/cost-per-mile?busId=clxxx...
```

**Response (Single Bus):**
```json
{
  "costPerKm": 12.86,
  "totalFuelCost": 4500,
  "totalDistanceTraveled": 350,
  "calculationPeriod": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-15T00:00:00.000Z"
  }
}
```

**Response (All Buses):**
```json
[
  {
    "busId": "clxxx...",
    "registrationNumber": "DL-01-AB-1234",
    "costPerKm": 12.86,
    "totalFuelCost": 9300,
    "totalDistanceTraveled": 350
  }
]
```

## Alerts & Reminders Endpoints

### GET /api/alerts
Get all upcoming alerts and expiries.

**Query Parameters:**
- `days`: Number of days to look ahead (default: 30)

**Example:**
```
GET /api/alerts?days=60
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "clzzz...",
      "type": "driver_license",
      "severity": "warning",
      "message": "Driver Rajesh Kumar's license expires in 15 days",
      "dueDate": "2024-02-01T00:00:00.000Z",
      "daysRemaining": 15,
      "entityId": "clxxx...",
      "entityName": "Rajesh Kumar"
    },
    {
      "id": "claaa...",
      "type": "insurance",
      "severity": "critical",
      "message": "Insurance Renewal for bus DL-01-AB-1234 due in 5 days",
      "dueDate": "2024-01-20T00:00:00.000Z",
      "daysRemaining": 5,
      "entityId": "clyyy...",
      "entityName": "DL-01-AB-1234"
    }
  ],
  "criticalCount": 1,
  "warningCount": 2,
  "infoCount": 3
}
```

**Alert Severity Levels:**
- `critical`: 0-7 days remaining
- `warning`: 8-15 days remaining
- `info`: 16+ days remaining

**Alert Types:**
- `driver_license`: Driver's license expiry
- `insurance`: Bus insurance renewal
- `permit`: Route permit renewal
- `maintenance`: Oil change, fitness certificate, etc.
- `other`: Other reminders

### POST /api/alerts/resolve
Mark a reminder as resolved.

**Request Body:**
```json
{
  "reminderId": "clzzz..."
}
```

**Response:**
```json
{
  "id": "clzzz...",
  "busId": "clxxx...",
  "type": "Insurance_Renewal",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "status": "Resolved",
  "notes": "Comprehensive insurance renewal due"
}
```

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**
```json
{
  "error": "Missing required fields: busId, category, amount, date"
}
```

**404 Not Found**
```json
{
  "error": "Bus not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch fleet overview"
}
```

## Business Logic Functions

The following server-side functions are available in `/src/lib/services/`:

### analytics.ts
- `calculateCostPerMile(busId)`: Calculate fuel efficiency for a bus
- `getAllBusesCostPerMile()`: Get efficiency metrics for all buses
- `aggregateExpensesByCategory(startDate, endDate)`: Group expenses by category
- `getMonthlyExpenseComparison(year, month)`: Compare month-over-month expenses

### alerts.ts
- `checkDriverLicenseExpiries(daysThreshold)`: Get expiring driver licenses
- `checkBusReminders(daysThreshold)`: Get expiring bus-related items
- `getAllCriticalAlerts(daysThreshold)`: Get all alerts sorted by urgency
- `resolveReminder(reminderId)`: Mark a reminder as resolved

### fleet.ts
- `getFleetOverview()`: Get fleet statistics
- `getBusDetails(busId)`: Get detailed bus information
- `getAllBuses()`: Get all buses with summary information
