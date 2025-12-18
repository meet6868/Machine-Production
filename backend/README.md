# Machine Production Tracker - Backend

Backend API for the Machine Production Tracking System built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/machine-production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

## Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)
- `PUT /api/auth/first-login` - Update first login status (Protected)

### Machines
- `GET /api/machines` - Get all machines (Protected)
- `GET /api/machines/:id` - Get single machine (Protected)
- `POST /api/machines` - Create machine (Protected)
- `PUT /api/machines/:id` - Update machine (Protected)
- `DELETE /api/machines/:id` - Delete machine (Protected)

### Workers
- `GET /api/workers` - Get all workers (Protected)
- `GET /api/workers/:id` - Get single worker (Protected)
- `POST /api/workers` - Create worker (Protected)
- `PUT /api/workers/:id` - Update worker (Protected)
- `DELETE /api/workers/:id` - Delete worker (Protected)

### Production
- `GET /api/production` - Get all production records (Protected)
- `GET /api/production/stats` - Get production statistics (Protected)
- `GET /api/production/:id` - Get single production record (Protected)
- `POST /api/production` - Create production record (Protected)
- `PUT /api/production/:id` - Update production record (Protected)
- `DELETE /api/production/:id` - Delete production record (Protected)

## MongoDB Setup

### Local MongoDB
Make sure MongoDB is running on your system:
```bash
# Ubuntu/Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community
```

### MongoDB Atlas (Cloud)
If using MongoDB Atlas, update the `MONGODB_URI` in `.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/machine-production?retryWrites=true&w=majority
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── machineController.js # Machine CRUD operations
│   ├── workerController.js  # Worker CRUD operations
│   └── productionController.js # Production CRUD operations
├── middleware/
│   └── authMiddleware.js    # JWT authentication middleware
├── models/
│   ├── Company.js           # Company model
│   ├── User.js              # User model
│   ├── Machine.js           # Machine model
│   ├── Worker.js            # Worker model
│   └── Production.js        # Production model
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── machineRoutes.js     # Machine routes
│   ├── workerRoutes.js      # Worker routes
│   └── productionRoutes.js  # Production routes
├── utils/
│   └── generateToken.js     # JWT token generation
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── server.js                # Main application file
```

## Features

- ✅ JWT-based authentication
- ✅ Company-based data isolation
- ✅ RESTful API design
- ✅ Input validation
- ✅ Error handling
- ✅ CORS enabled
- ✅ MongoDB with Mongoose ODM

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Company-based data isolation to prevent data leakage
- Protected routes with authentication middleware

## License

MIT
