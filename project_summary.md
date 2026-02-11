The School Transport System is a comprehensive full-stack application built with Next.js. It leverages React for the frontend, Next.js API routes for the backend, and Prisma ORM to interact with a PostgreSQL database. TypeScript is used throughout the codebase for type safety.

**Key Features and Modules:**

1.  **Authentication and User Management:**
    *   `User` model with roles (`admin`, `staff`, `viewer`).
    *   API endpoints for login, logout, registration, and fetching current user details (`/api/auth/*`).
    *   Uses JWT for session management (`jose`, `jsonwebtoken`) and `bcryptjs` for password hashing.
    *   Includes rate-limiting for auth endpoints.

2.  **Bus Management:**
    *   `Bus` model storing details like registration number, chassis number, seating capacity, purchase date, ownership type, and primary driver.
    *   Tracks various expiry dates (insurance, fitness, registration) and generates reminders.
    *   API endpoints for CRUD operations on buses (`/api/fleet/buses`).
    *   Detailed bus view including expenses, documents, students, and mileage (`/api/fleet/buses/[id]`).

3.  **Driver Management:**
    *   `Driver` model for name, role (`driver`, `conductor`), license details, phone, and address.
    *   API endpoints for CRUD operations on drivers (`/api/drivers`).
    *   Driver-specific details including assigned routes (`/api/drivers/[id]`).

4.  **Route Management:**
    *   `Route` model defining route names, start/end points, total distance, and optional waypoints (JSON).
    *   `BusRoute` model links buses, drivers, and conductors to specific routes for an academic term.
    *   API endpoints for CRUD operations on routes and assigning buses to routes (`/api/routes/*`).

5.  **Student Management:**
    *   `Student` model with details like name, class, village, parent contact, bus assignment, and fee information.
    *   Tracks student activity status (`isActive`) and status history.
    *   API endpoints for CRUD operations on students (`/api/students`).
    *   Functionality to promote students to the next class (`/api/students/promote`).
    *   Bus capacity checks during student creation.

6.  **Expense Management:**
    *   `Expense` model categorizing expenses (Fuel, Urea, Maintenance, Salary, Insurance, Other) for each bus.
    *   API endpoints for logging, retrieving (with filters), deleting, and aggregating expenses (`/api/expenses/*`).
    *   Calculates cost-per-mile metrics.

7.  **Payment Management:**
    *   `Payment` model for student fee payments, including amount, date, academic year, payment method, and unique receipt numbers.
    *   `BusOwnerPayment` model tracks payments made to private bus owners, including commission and advance payments.
    *   API endpoints for collecting student payments (`/api/payments`) and managing bus owner payments (`/api/bus-owner-payments`).
    *   Provides payment statistics for bus owners.

8.  **Inventory Management (Fuel & Urea):**
    *   `FuelPurchase` and `UreaPurchase` models record purchases.
    *   `FuelDispense` and `UreaDispense` models record dispenses to buses, including stock checks.
    *   `PersonalVehicleFuelDispense` tracks fuel for personal vehicles.
    *   API endpoints for managing purchases, dispenses, and checking current inventory levels (`/api/fuel/*`, `/api/urea/*`, `/api/personal-vehicles/dispense`).

9.  **Document Upload and Reminders:**
    *   `BusDocument` and `DriverDocument` models for storing file URLs and metadata.
    *   `Reminder` model tracks due dates for various bus-related certifications/renewals.
    *   API endpoints for document CRUD and fetching alerts (`/api/alerts`).

10. **Data Export:**
    *   API endpoints to export various datasets (buses, expenses, routes, drivers, alerts, students) based on specified criteria (`/api/export/*`).

**Frontend Structure (React/Next.js):**
*   **Pages (`src/app/`):** Each major feature (e.g., `/fleet`, `/drivers`, `/students`, `/expenses`) has its dedicated page, serving as an entry point for that module.
*   **Components (`src/components/`):** A modular design approach with reusable React components such as:
    *   Modals for adding/editing entities (`AddBusModal`, `EditStudentModal`, `CollectPaymentModal`).
    *   Tables for displaying lists of data (`DriversTable`, `FleetTable`, `RoutesTable`).
    *   Detailed view components (`BusDetailsContent`, `DriverDetailsContent`).
    *   Specialized components like `RouteMapPicker`, `InsuranceTracker`, `LicenseTracker`, `DashboardContent`, `StatCard`.

**Technologies Used:**
*   **Framework:** Next.js
*   **Frontend Library:** React
*   **Language:** TypeScript
*   **Database:** PostgreSQL (implied by Prisma provider)
*   **ORM:** Prisma
*   **Styling:** Tailwind CSS
*   **Validation:** Zod
*   **Authentication:** JWT (`jose`, `jsonwebtoken`), `bcryptjs`
*   **Utilities:** `date-fns`, `clsx`
*   **Testing:** Jest, `@testing-library/react`, `@testing-library/jest-dom`