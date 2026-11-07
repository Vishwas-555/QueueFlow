# QueueFlow — Real-Time Queue & Appointment Management System

QueueFlow is a real-time queue management platform designed to simplify customer waiting experiences and help administrators efficiently manage service queues.

It allows customers to join queues, track their positions, view estimated waiting times, and receive live updates. Administrators can manage services, monitor active queues, call customers, update queue statuses, and control queue sessions.

Built using **React, Node.js, Express.js, PostgreSQL, and Socket.IO**.

---

## 🚀 Key Features

### 👤 Customer Features
- Customer registration and login.
- Browse available services.
- Join an active queue.
- Receive a unique ticket number.
- View current queue position.
- Track estimated waiting time.
- View active queues.
- Cancel queue entries when waiting.
- Receive real-time queue updates.
- Get notified when an administrator closes a queue session.
- Refresh dashboard to retrieve the latest information.

### 🛠️ Admin Features
- Secure administrator authentication.
- Create and manage services.
- Start and close queue sessions.
- View active queue sessions.
- Monitor customers in each queue.
- Call the next customer.
- Support multiple customers in SERVING status.
- Mark customers as COMPLETED or SKIPPED.
- Prevent queue closure while customers are WAITING or SERVING.
- Assign priority levels to waiting customers.
- Monitor queue activity through real-time updates.

### ⚡ Real-Time Functionality
QueueFlow uses Socket.IO to provide real-time communication between customers and administrators.

Events include:
- `queue-updated`
- `queue-session-started`
- `queue-session-closed`

These events help dashboards stay synchronized without requiring users to manually refresh after every queue operation.

### 🎯 Priority Queue Management

QueueFlow supports three priority levels:

| Priority | Value |
|---|---:|
| Normal | 0 |
| Medium | 1 |
| High | 2 |

Customers with higher priority are served first.

Queue ordering follows:

1. Higher priority first.
2. Earlier joining time first.
3. Entry ID as a deterministic tie-breaker.

Priority changes are restricted to customers who are still WAITING.

---

## 🧰 Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- Tailwind CSS
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO
- JSON Web Tokens (JWT)
- bcrypt

### Database
- PostgreSQL

### Development Tools
- Git
- GitHub
- Postman
- VS Code

---

## 🏗️ System Architecture

QueueFlow follows a client-server architecture.

             CUSTOMER / ADMIN
                    |
                    |
              React Frontend
                    |
          HTTP REST API / Socket.IO
                    |
                    |
             Node.js Backend
                    |
          Express Controllers
                    |
                    |
              PostgreSQL
```

**REST API:** Handles authentication, services, queue operations, and database interactions.

**Socket.IO:** Handles real-time communication between connected clients.

**PostgreSQL:** Stores users, services, queue sessions, and queue entries.

---

## 🔄 Application Workflow

### Customer Workflow

1. Customer registers or logs in.
2. Customer views available services.
3. Customer selects a service and joins its active queue.
4. System generates a ticket number.
5. Customer tracks queue position and estimated waiting time.
6. Customer receives real-time updates as the queue progresses.
7. Customer can cancel an entry while it is WAITING.

### Admin Workflow

1. Administrator logs in.
2. Administrator creates services.
3. Administrator starts a queue session.
4. Customers can join the active queue.
5. Administrator monitors waiting customers.
6. Administrator calls the next customer.
7. Administrator completes or skips customer entries.
8. Administrator closes the queue session when no customers are WAITING or SERVING.

---

## 🔐 Authentication and Security

- JWT-based authentication.
- Password hashing using bcrypt.
- Protected backend routes.
- Role-based access control for administrators and customers.
- Socket.IO authentication using JWT.
- Server-side validation of queue operations.

---

## ⚙️ Concurrency Handling

QueueFlow handles concurrent requests to maintain data consistency.

Database transactions and row-level locking are used in critical queue operations.

Important scenarios handled include:

- Concurrent customer joins.
- Duplicate queue entry prevention.
- Concurrent Call Next operations.
- Concurrent queue session creation.
- Concurrent queue session closure.
- Join versus Close race conditions.
- Concurrent cancellation requests.
- Complete versus Skip operations.

The goal is to ensure that simultaneous requests do not produce inconsistent queue states.

---

## 🧪 Testing

The application has undergone functional, multi-user, and concurrency testing.

### Functional Testing
- Customer registration and login.
- Admin authentication.
- Service creation and management.
- Starting and closing queue sessions.
- Customer queue joining and cancellation.
- Ticket number and position updates.
- Call Next functionality.
- Complete and Skip operations.
- Priority-based queue ordering.
- Real-time updates across multiple clients.

## 📁 Project Structure

```text
QueueFlow/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── sockets/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── socket.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## 💻 Getting Started

Follow these steps to run QueueFlow locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Vishwas-555/QueueFlow.git
```

```bash
cd QueueFlow
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure the backend environment variables in a `.env` file.

Provide the required PostgreSQL connection details and JWT secret according to the backend configuration.

Start the backend:

```bash
node server.js
```

The backend runs on port `5000` in the current development configuration.

### 3. Frontend Setup

Open another terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure the frontend environment variables if required.

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

---

## 🔑 Environment Configuration

Create the necessary environment files locally.

**Backend `.env`:**

Configure:
- PostgreSQL database connection settings.
- JWT secret.

**Frontend `.env.local`:**

Configure any frontend environment variables required by the application, including the backend API URL if configured through Vite environment variables.

Do not commit environment files or expose database credentials, JWT secrets, or other sensitive information on GitHub.

---

## 🔮 Future Improvements

Potential improvements include:

- Appointment scheduling.
- Email and SMS notifications.
- Analytics and reporting dashboard.
- Advanced queue performance metrics.
- Deployment with a production database.
- Improved customer notification mechanisms.

---

## 👨‍💻 Author

**Vishwas**

GitHub: [Vishwas-555](https://github.com/Vishwas-555)

Project Repository: [QueueFlow](https://github.com/Vishwas-555/QueueFlow)

---

## ⭐ Support

If you find this project interesting, consider giving the repository a star!

**QueueFlow — Making queues better, one customer at a time.**
