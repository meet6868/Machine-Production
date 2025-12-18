# Machine Production Tracker

A full-stack MERN application for tracking machine production, workers, and fabric output in manufacturing environments.

## 🚀 Features

- **User Authentication** - Secure JWT-based authentication with company isolation
- **Machine Management** - Track single and double-width fabric production machines
- **Worker Management** - Manage workers across different shifts (Morning, Afternoon, Night)
- **Production Tracking** - Record daily production data with fabric quantity and length
- **Real-time Analytics** - View production statistics and performance metrics
- **Multi-user Support** - Team collaboration within the same company
- **Data Isolation** - Complete data separation between different companies
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd machine-production-mern
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret
# MONGODB_URI=mongodb://localhost:27017/machine-production
# JWT_SECRET=your-secret-key
# PORT=5000

# Start the backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. MongoDB Setup

Make sure MongoDB is running:

**Ubuntu/Linux:**
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

**macOS:**
```bash
brew services start mongodb-community
```

**Windows:**
Start MongoDB service from Services or run:
```bash
net start MongoDB
```

**Alternative: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in backend `.env` file

## 📱 Usage

1. **Visit the Landing Page**: Navigate to `http://localhost:3000`
2. **Sign Up**: Click "Get Started" and create an account with your company name
3. **Onboarding**: Follow the step-by-step tutorial
4. **Add Machines**: Go to Machines page and add your production machines
5. **Add Workers**: Go to Workers page and register your workers
6. **Track Production**: Record daily production data in the Production page
7. **View Analytics**: Check the Dashboard for statistics and insights

## 🏗️ Tech Stack

### Frontend
- **React** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Icons** - Icon library
- **React Toastify** - Notifications
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📁 Project Structure

```
machine-production-mern/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Context providers
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Utility functions
│   │   ├── App.jsx      # Main component
│   │   └── main.jsx     # Entry point
│   ├── public/          # Static files
│   └── index.html       # HTML template
└── README.md
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Company-based data isolation
- Token expiry handling
- Input validation

## 🎨 Design System

The application uses a centralized theme with:
- **Primary Color**: Blue
- **Secondary Color**: Gray
- **Success**: Green
- **Warning**: Orange
- **Danger**: Red

All colors are customizable in `frontend/tailwind.config.js`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Machines
- `GET /api/machines` - Get all machines
- `POST /api/machines` - Create machine
- `PUT /api/machines/:id` - Update machine
- `DELETE /api/machines/:id` - Delete machine

### Workers
- `GET /api/workers` - Get all workers
- `POST /api/workers` - Create worker
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker

### Production
- `GET /api/production` - Get all production records
- `GET /api/production/stats` - Get statistics
- `POST /api/production` - Create production record
- `PUT /api/production/:id` - Update record
- `DELETE /api/production/:id` - Delete record

## 🚀 Deployment

This application is ready for deployment on Render.com with MongoDB Atlas.

### Quick Deployment Steps

1. **Database Setup**: Create a MongoDB Atlas cluster and get your connection string
2. **Deploy Backend**: Create a Web Service on Render for the backend
3. **Deploy Frontend**: Create a Static Site on Render for the frontend
4. **Configure Environment**: Set up environment variables for both services
5. **Update CORS**: Update backend CORS_ORIGIN with your frontend URL

📖 **For complete deployment instructions**, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Required Environment Variables

**Backend:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGIN` - Frontend URL for CORS
- `NODE_ENV` - Set to `production`

**Frontend:**
- `VITE_API_URL` - Backend API URL

### Deployment Configuration

The project includes:
- ✅ `render.yaml` - Automated Render deployment configuration
- ✅ `DEPLOYMENT.md` - Comprehensive deployment guide
- ✅ `.env.example` files - Environment variable templates
- ✅ Health check endpoints - For service monitoring

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first approach
- MongoDB team for the database
- All open-source contributors
