# NeuroAssess Backend

This is the backend server for the NeuroAssess application, built with Node.js, Express, and MongoDB.

## Tech Stack

- Node.js
- Express.js
- MongoDB (Database)
- JWT (Authentication)
- Jest (Testing)

## Project Structure

```
backend/
├── docs/               # Documentation files
├── src/               # Source code
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Custom middleware
│   ├── models/        # Data models
│   ├── routes/        # API routes
│   └── index.js       # Main application file
├── .env.example       # Example environment variables
├── package.json       # Project dependencies
└── README.md         # Project documentation
```

## Setup Instructions

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Update the `.env` file with your MongoDB URI and other configuration

## Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot-reload
- `npm test`: Run tests

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Tests
- `POST /api/tests` - Create a new test
- `GET /api/tests/:id` - Get test by ID
- `PUT /api/tests/:id` - Update test results

### Learning Plans
- `GET /api/learning-plans/:userId` - Get user's learning plan
- `POST /api/learning-plans` - Create new learning plan
- `PUT /api/learning-plans/:id` - Update learning plan

### Messages
- `GET /api/messages` - Get user's messages
- `POST /api/messages` - Send a new message
- `PUT /api/messages/:id` - Update message status

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is private and confidential. 