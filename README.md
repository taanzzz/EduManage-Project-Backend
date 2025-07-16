# EduManage - Backend Server

Welcome to the backend server for the **EduManage** E-Learning Platform. This server is built with Node.js, Express.js, and MongoDB, providing a robust RESTful API to support all functionalities of the frontend application.

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js Badge" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js Badge" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Badge" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT Badge" />
  <img src="https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe Badge" />
</div>

---

## 🚀 Features

- **Secure Authentication:** JWT-based authentication to secure private routes.
- **Role-Based Access Control (RBAC):** Separate permissions and API access for Students, Teachers, and Admins.
- **Class Management:** Full CRUD API for managing classes, including admin approval system.
- **Enrollment & Payment:** Secure payment intent generation using Stripe and robust enrollment tracking.
- **User Management:** APIs for admins to view all users and manage their roles.
- **Teacher Application System:** Endpoints for handling teacher applications and their approval process.
- **Dynamic Data API:** Publicly accessible endpoints to power the homepage with dynamic stats, popular classes, feedback, and banners.
- **Assignment & Submission Handling:** APIs to create assignments and track student submissions.

---

## 🛠️ API Endpoints

Here is a summary of the main API routes available:

| Method | Endpoint                             | Description                               | Access      |
| :---   | :----------------------------------- | :---------------------------------------- | :---------- |
| POST   | `/api/auth/jwt`                      | Creates/verifies a user and issues a JWT. | Public      |
| GET    | `/api/public/banners`                | Fetches active banners for the homepage.    | Public      |
| GET    | `/api/public/popular-classes`        | Fetches top 6 popular classes.          | Public      |
| GET    | `/api/classes/approved`              | Fetches all approved classes (paginated). | Public      |
| GET    | `/api/classes/:id`                   | Fetches details for a single class.      | Private     |
| POST   | `/api/payments/create-payment-intent`| Creates a Stripe Payment Intent.         | Private     |
| POST   | `/api/enrollments/confirm`           | Confirms enrollment after payment.       | Private     |
| GET    | `/api/enrollments/my-classes/:email` | Get all enrolled classes for a student.  | Private     |
| POST   | `/api/teacher/apply`                 | Submit an application to be a teacher.   | Private     |
| GET    | `/api/assignments/class/:id`         | Get all assignments for a class.         | Private     |
| POST   | `/api/submissions`                   | Submit an assignment.                    | Private     |
| POST   | `/api/classes`                       | Add a new class.                         | Teacher     |
| GET    | `/api/classes/my-classes/:email`     | Get all classes created by a teacher.    | Teacher     |
| GET    | `/api/admin/all-classes`             | Get all classes for admin view.          | Admin       |
| PATCH  | `/api/admin/status/:id`              | Approve or reject a class.               | Admin       |
| GET    | `/api/users`                         | Get all users for admin view.            | Admin       |
| PATCH  | `/api/users/admin/:id`               | Promote a user to admin.                 | Admin       |
| GET    | `/api/teacher/requests`              | Get all teacher applications.            | Admin       |
| PATCH  | `/api/teacher/requests/:id`          | Approve or reject a teacher request.     | Admin       |


---

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file in the root directory:

```
# Server Port
PORT=5000

# MongoDB Connection URI
MONGODB_URI=[Your MongoDB URI with database name 'EduManageDB']

# JSON Web Token Secret
JWT_SECRET=[Your JWT secret key ]

# Stripe Secret Key
STRIPE_SECRET_KEY=[Your Stripe secret key]
```

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/taanzzz/EduManage-Project-Backend]
    ```

2.  **Navigate to the server directory:**
    ```bash
    cd [Your project folder name]
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Create a `.env` file** in the root and add the required variables as shown in the section above.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

The server will start on `http://localhost:5000`.