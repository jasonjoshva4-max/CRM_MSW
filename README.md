# ember. — Multi-User CRM

**A modern, role-based Customer Relationship Management platform built to simplify customer management, sales operations, and team collaboration.**

![Project](https://img.shields.io/badge/Project-Multi--User%20CRM-6366f1)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Language](https://img.shields.io/badge/Language-Python%20%7C%20TypeScript-blue)
![Database](https://img.shields.io/badge/Database-SQLite-003B57)
![Authentication](https://img.shields.io/badge/Auth-JWT-orange)

---

## 1. Overview

**ember.** is a multi-user Customer Relationship Management (CRM) system designed to help organizations manage customer relationships, monitor sales activities, organize employees, and streamline daily business operations.

The platform provides centralized customer and lead management, role-based access control, task assignments, follow-up scheduling, interaction tracking, notifications, and reporting.

It is designed around three primary user roles:

- **Admin:** Manages employees, oversees organizational operations, and has administrative access.
- **Manager:** Coordinates team activities, monitors assigned employees, and manages operational workflows.
- **Employee:** Handles assigned customers, leads, follow-ups, and daily tasks.

The goal is to create a centralized workspace where teams can manage their customer lifecycle efficiently.

## 2. Key Features

### Authentication and Authorization
- User registration and login.
- JWT-based authentication.
- Protected application routes.
- Role-based access control.
- Secure password handling.

### Employee Management
- Employee creation and management.
- Employee information management.
- Manager assignment and team organization.
- Administrative employee oversight.

### Customer Management
- Centralized customer records.
- Customer information management.
- Customer record creation, viewing, updating, and deletion.
- Organized customer information.

### Lead Management
- Lead creation and tracking.
- Lead assignment and management.
- Lead status monitoring.
- Centralized sales prospect information.

### Follow-up Management
- Schedule customer follow-ups.
- Track upcoming follow-up activities.
- Maintain follow-up records.
- Improve customer engagement.

### Interaction Management
- Record customer interactions.
- Maintain communication history.
- Track activities associated with customers and leads.

### Task Management
- Create and manage tasks.
- Assign work to team members.
- Monitor task progress.
- Organize operational activities.

### Notifications
- Centralized notifications.
- Updates related to application activities.
- Improved awareness of assigned work and important events.

### Dashboard and Reporting
- Dashboard summaries.
- Business activity monitoring.
- Search functionality.
- Reports for operational visibility.

### User Profile
- Personal profile management.
- Profile information updates.
- Profile picture support.

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLite |
| ORM | SQLAlchemy |
| Authentication | JWT |
| API Documentation | OpenAPI, Swagger UI |
| Development Tools | Visual Studio Code, Git, GitHub |

## 4. System Architecture

The application follows a frontend-backend architecture.

```text
                 ember. CRM
                      |
          +-----------+-----------+
          |                       |
       Frontend                 Backend
          |                       |
    Next.js / React             FastAPI
          |                       |
    TypeScript UI             REST APIs
          |                       |
          +---------- HTTP -------+
                                  |
                         Authentication
                              JWT
                                  |
                           SQLAlchemy ORM
                                  |
                              SQLite
```

### Frontend
The frontend is developed using Next.js and TypeScript. It provides the user interface for authentication, dashboards, customer management, leads, tasks, follow-ups, notifications, and other CRM functionality.

### Backend
The backend uses FastAPI to expose RESTful APIs. It handles business logic, authentication, authorization, employee management, customer operations, and database interactions.

### Database
SQLite is used for persistent application data, with SQLAlchemy providing object-relational mapping between application models and database tables.

## 5. Project Structure

```text
CRM/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── customer.py
│   │   │   ├── lead.py
│   │   │   ├── user.py
│   │   │   └── work_items.py
│   │   │
│   │   ├── routes/
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── customers.py
│   │   │   ├── employees.py
│   │   │   ├── leads.py
│   │   │   ├── profile.py
│   │   │   └── workspace.py
│   │   │
│   │   ├── create_admin.py
│   │   ├── create_manager.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   └── schemas.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── activities/
│   │   ├── admin/
│   │   ├── customers/
│   │   ├── follow-ups/
│   │   ├── interactions/
│   │   ├── leads/
│   │   ├── login/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── reports/
│   │   ├── search/
│   │   └── tasks/
│   │
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 6. Installation and Setup

### Prerequisites

Install the following before running the project:

- Python 3.10 or later
- Node.js and npm
- Git
- Visual Studio Code (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/MSWProjects/CRM.git
cd CRM
```

### Step 2: Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the required dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Backend Environment Configuration

Create a `.env` file inside the `backend` directory.

Example configuration:

```env
SECRET_KEY=replace-with-a-long-random-secret
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Use a strong, randomly generated secret key. Never commit actual environment secrets to GitHub.

### Step 4: Start the Backend Server

Run:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend server:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### Step 5: Frontend Setup

Open a separate terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Step 6: Start the Frontend

```bash
npm run dev
```

Frontend application:

```text
http://localhost:3000
```

The frontend and backend should both be running while using the application.

## 7. Authentication and Role-Based Access

ember. uses JSON Web Tokens (JWT) to authenticate users and protect application resources.

Typical authentication flow:

1. A user submits their login credentials.
2. The backend validates the credentials.
3. The backend issues an authentication token.
4. The frontend uses the token when accessing protected API endpoints.
5. The backend validates the token and checks the user's permissions.
6. Authorized requests are processed.

### User Roles

| Role | Responsibilities |
|---|---|
| Admin | Employee administration and organizational oversight |
| Manager | Team coordination and operational management |
| Employee | Customer handling and assigned work |

Access permissions are enforced by the backend rather than relying only on frontend navigation.

## 8. API Documentation

FastAPI provides interactive API documentation through Swagger UI.

Once the backend is running, visit:

```text
http://127.0.0.1:8000/docs
```

The API is organized around application modules such as:

- Authentication
- Administration
- Employee management
- Customer management
- Lead management
- Profile management
- Workspace operations

The documentation allows developers to inspect endpoints, request parameters, response structures, and test API operations.

## 9. Security Considerations

Security is an important part of the application architecture.

The project incorporates:

- JWT-based authentication.
- Password hashing.
- Role-based authorization.
- Protected backend endpoints.
- Environment-based secret configuration.
- CORS configuration.
- Separation of frontend and backend responsibilities.

**Important:** Production deployments should use HTTPS, secure secret management, appropriate token expiration and refresh policies, database backups, and production-grade database infrastructure.

## 10. Future Enhancements

Potential improvements for future versions include:

- Real-time notifications.
- Advanced sales analytics.
- Interactive charts and performance dashboards.
- Email integration.
- Automated follow-up reminders.
- Customer communication integrations.
- Advanced filtering and search.
- Exportable business reports.
- Audit logs and activity tracking.
- Cloud deployment and scalability improvements.

## 11. Running the Project Locally

For development, run both servers in separate terminals.

**Terminal 1 — Backend**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend**

```powershell
cd frontend
npm run dev
```

Open the application:

```text
http://localhost:3000
```

## 12. Project Objective

The primary objective of ember. is to provide a centralized CRM environment that improves customer relationship management, streamlines employee workflows, and enables organizations to maintain visibility over their business operations.

By combining a modern frontend, API-driven backend, database persistence, and role-based access control, ember. establishes a foundation for a scalable multi-user CRM platform.

---

**Built with a focus on usability, maintainability, and organized business workflows.**

**Project:** ember. — Multi-User CRM  
**Repository:** https://github.com/jasonjoshva4-max/CRM_MSW
