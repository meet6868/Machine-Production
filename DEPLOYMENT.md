# Deployment Guide for Render

This guide will help you deploy the Machine Production Tracker application to Render.com.

## Prerequisites

- [Render.com](https://render.com) account (free tier available)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier available)
- GitHub repository with your code

---

## Part 1: Setup MongoDB Atlas (Database)

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create a free account
3. Click "Build a Database"
4. Choose **FREE** tier (M0 Sandbox)
5. Select your preferred **Cloud Provider & Region** (Singapore recommended)
6. Click "Create Cluster"

### Step 2: Create Database User

1. Go to **Database Access** (left sidebar)
2. Click "Add New Database User"
3. Choose **Password** authentication
4. Create username and password
   - **Important**: If your password contains special characters, note them for URL encoding
   - Example: `Meet@5568` becomes `Meet%405568` in connection string
5. Set **Database User Privileges** to "Atlas admin"
6. Click "Add User"

### Step 3: Whitelist IP Addresses

1. Go to **Network Access** (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Render to connect
4. Click "Confirm"

### Step 4: Get Connection String

1. Go to **Database** (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select **Driver**: Node.js, **Version**: 5.5 or later
5. Copy the connection string
6. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with your actual credentials
8. **URL encode special characters in password**:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - etc.

**Example**:
```
Original password: Meet@5568
Encoded password: Meet%405568
Final URL: mongodb+srv://myuser:Meet%405568@cluster.mongodb.net/machine-production?retryWrites=true&w=majority
```

---

## Part 2: Deploy Backend to Render

### Step 1: Create Backend Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Service Details:**
- **Name**: `machine-production-backend` (or your choice)
- **Region**: Singapore (or nearest to you)
- **Branch**: `main` or `version-4`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free

### Step 2: Add Environment Variables

Click "Advanced" and add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | Render will override this |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate random string | Use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CORS_ORIGIN` | Leave empty for now | Will update after frontend deployment |

**To generate JWT_SECRET** (run in terminal):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Deploy Backend

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://machine-production-backend.onrender.com`
4. Test the health endpoint: `https://your-backend-url.onrender.com/api/health`

---

## Part 3: Deploy Frontend to Render

### Step 1: Create Frontend Static Site

1. Go to Render Dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:

**Service Details:**
- **Name**: `machine-production-frontend` (or your choice)
- **Region**: Singapore (or nearest to you)
- **Branch**: `main` or `version-4`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Step 2: Add Environment Variable

Click "Advanced" and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com/api` |

**Replace** `your-backend-url` with your actual backend URL from Part 2.

### Step 3: Configure Redirects/Rewrites

Render will automatically handle this for React apps, but if needed:

1. Create `frontend/public/_redirects` file:
   ```
   /*  /index.html  200
   ```

### Step 4: Deploy Frontend

1. Click "Create Static Site"
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://machine-production-frontend.onrender.com`

---

## Part 4: Update CORS Configuration

### Step 1: Update Backend CORS

1. Go to your backend service on Render
2. Go to "Environment" tab
3. Update or add `CORS_ORIGIN` variable:
   ```
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```
4. Click "Save Changes"
5. Backend will automatically redeploy

### Step 2: Test the Application

1. Visit your frontend URL
2. Try logging in
3. Test all features

---

## Part 5: Post-Deployment Setup

### 1. Create Initial User (If Database is Empty)

If you haven't migrated data, create an admin user:

**Option A: Using MongoDB Atlas UI**
1. Go to MongoDB Atlas → Database → Browse Collections
2. Find `users` collection
3. Insert a document:
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "$2a$10$...", // Use bcrypt to hash password
  "role": "admin",
  "company": ObjectId("..."), // Your company ID
  "isActive": true,
  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

**Option B: Using Migration Script**
Run the migration script you created to import data from SQLite.

### 2. Create Company

1. In MongoDB Atlas, create a company document:
```json
{
  "name": "Your Company Name",
  "address": "Your Address",
  "contactEmail": "contact@example.com",
  "contactPhone": "1234567890",
  "isActive": true,
  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

### 3. Add Machines and Workers

Use the application UI to add machines and workers, or import from SQLite using the migration script.

---

## Troubleshooting

### Backend Issues

**1. MongoDB Connection Failed**
- Check MongoDB Atlas IP whitelist (should be 0.0.0.0/0)
- Verify connection string in environment variables
- Ensure password is URL-encoded
- Check MongoDB Atlas user has correct permissions

**2. CORS Errors**
- Verify `CORS_ORIGIN` environment variable matches frontend URL exactly
- Include `https://` in the URL
- Redeploy backend after changing CORS_ORIGIN

**3. 503 Service Unavailable**
- Check Render logs: Service → Logs
- Verify `npm start` command works
- Check if PORT is properly configured

### Frontend Issues

**1. API Calls Failing**
- Verify `VITE_API_URL` points to correct backend URL
- Include `/api` at the end of the URL
- Check browser console for CORS errors

**2. Build Fails**
- Check build logs in Render
- Verify all dependencies in package.json
- Try building locally: `npm run build`

**3. Blank Page After Deployment**
- Check browser console for errors
- Verify `dist` folder is being published
- Check if routes are configured (rewrites)

### Database Issues

**1. No Data Showing**
- Verify MongoDB connection is successful
- Check if collections exist in MongoDB Atlas
- Import data using migration script

**2. Authentication Errors**
- Create admin user in database
- Reset password if needed
- Check JWT_SECRET is set

---

## Environment Variables Reference

### Backend (.env)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/machine-production
JWT_SECRET=your-long-random-secret-key
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend-url.onrender.com/api
```

---

## Render Free Tier Limitations

- **Backend (Web Service)**:
  - Spins down after 15 minutes of inactivity
  - Takes 30-60 seconds to spin up on first request
  - 750 hours/month free

- **Frontend (Static Site)**:
  - Always available (no spin down)
  - 100 GB bandwidth/month
  - Unlimited sites

- **Workaround for Spin Down**:
  - Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your backend every 10 minutes
  - Or upgrade to paid plan ($7/month for always-on)

---

## Monitoring & Maintenance

### View Logs
1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. View real-time logs

### Update Application
1. Push changes to GitHub
2. Render automatically detects and redeploys
3. Or manually trigger: Service → Manual Deploy → Deploy latest commit

### Backup Database
1. Use MongoDB Atlas backup features
2. Or export data regularly using mongodump
3. Keep local SQLite backups for safety

---

## Custom Domain (Optional)

### Add Custom Domain to Frontend
1. Go to frontend service → Settings
2. Click "Add Custom Domain"
3. Enter your domain
4. Add DNS records as instructed by Render:
   - Type: CNAME
   - Name: www
   - Value: your-frontend.onrender.com
5. SSL certificate is automatically provisioned

### Add Custom Domain to Backend
1. Go to backend service → Settings
2. Follow same process
3. Update frontend `VITE_API_URL` to use new domain

---

## Security Best Practices

1. **Use Strong JWT Secret**: Generate with crypto.randomBytes(64)
2. **Enable MongoDB Network Restrictions**: Whitelist only necessary IPs
3. **Use Environment Variables**: Never commit .env files
4. **HTTPS Only**: Render provides free SSL certificates
5. **Regular Updates**: Keep dependencies updated
6. **Monitor Logs**: Check regularly for errors or suspicious activity
7. **Backup Data**: Regular MongoDB backups

---

## Cost Optimization

### Free Tier Strategy
- Keep both frontend and backend on free tier
- Use MongoDB Atlas free tier (512 MB storage)
- Use UptimeRobot to keep backend alive

### If You Need to Upgrade
- Backend: $7/month for always-on
- Database: MongoDB Atlas $9/month for 2GB
- Frontend: Stays free (static sites are always free)

---

## Support & Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

## Quick Deployment Checklist

- [ ] Create MongoDB Atlas cluster
- [ ] Create database user and whitelist IPs
- [ ] Get MongoDB connection string (with URL-encoded password)
- [ ] Push code to GitHub
- [ ] Deploy backend to Render
  - [ ] Set environment variables
  - [ ] Wait for deployment
  - [ ] Test health endpoint
- [ ] Deploy frontend to Render
  - [ ] Set VITE_API_URL
  - [ ] Wait for deployment
- [ ] Update backend CORS_ORIGIN
- [ ] Test complete application
- [ ] Create initial admin user (if needed)
- [ ] Import/migrate data (if needed)
- [ ] Setup uptime monitoring (optional)

---

**Congratulations! Your application is now deployed! 🎉**

For issues or questions, check the troubleshooting section or Render logs.
