# Machine Production Tracker - Frontend

React frontend application for the Machine Production Tracking System with Tailwind CSS.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Main layout with sidebar
│   │   ├── PrivateRoute.jsx    # Protected route wrapper
│   │   └── PublicRoute.jsx     # Public route wrapper
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context
│   ├── pages/
│   │   ├── Landing.jsx         # Landing page
│   │   ├── Login.jsx           # Login page
│   │   ├── Signup.jsx          # Signup page
│   │   ├── Onboarding.jsx      # First-time user tutorial
│   │   ├── Dashboard.jsx       # Dashboard with statistics
│   │   ├── Machines.jsx        # Machine management
│   │   ├── Workers.jsx         # Worker management
│   │   └── Production.jsx      # Production tracking
│   ├── utils/
│   │   ├── api.js              # Axios instance and API calls
│   │   └── authHelpers.js      # JWT token helpers
│   ├── App.jsx                 # Main app component with routes
│   ├── main.jsx                # App entry point
│   └── index.css               # Tailwind CSS imports
├── public/
├── index.html
├── package.json
├── tailwind.config.js          # Tailwind configuration
├── vite.config.js              # Vite configuration
└── postcss.config.js           # PostCSS configuration
```

## Features

### Pages
- **Landing Page** - Marketing page with features and CTAs
- **Authentication** - Login and Signup with JWT tokens
- **Onboarding** - Step-by-step tutorial for new users
- **Dashboard** - Overview with statistics and quick actions
- **Machines** - CRUD operations for machine management
- **Workers** - CRUD operations for worker management
- **Production** - Track daily production with analytics

### Components
- **Responsive Design** - Mobile-first approach
- **Dark Sidebar** - Persistent navigation
- **Modal Forms** - Clean UI for data entry
- **Toast Notifications** - User feedback
- **Loading States** - Better UX during API calls
- **Protected Routes** - JWT-based authentication
- **Token Management** - Auto-refresh and expiry handling

### Theme
Centralized theme configuration with:
- Primary colors (Blue)
- Secondary colors (Gray)
- Success, Warning, Danger colors
- Custom spacing and shadows
- Consistent typography

## Environment Variables

The frontend uses Vite's proxy configuration. Update `vite.config.js` if your backend runs on a different port:

```js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Icons** - Icon library
- **React Toastify** - Toast notifications
- **Vite** - Build tool and dev server

## Authentication Flow

1. User visits landing page at `/home`
2. User signs up or logs in
3. JWT token stored in localStorage
4. Token sent with all API requests via Axios interceptor
5. Protected routes check for valid token
6. Automatic logout on token expiration

## API Integration

All API calls are centralized in `src/utils/api.js`:

```javascript
import { authAPI, machineAPI, workerAPI, productionAPI } from './utils/api';

// Example usage
const response = await machineAPI.getAll();
const machines = response.data.data;
```

## Styling

Custom Tailwind classes are defined in `src/index.css`:

- `btn`, `btn-primary`, `btn-secondary`, etc.
- `input`, `label`
- `card`
- `badge`, `badge-primary`, etc.

## License

MIT
