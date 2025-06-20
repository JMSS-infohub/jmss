# Quick Setup Guide

## 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### How to get your DATABASE_URL from Neon:
1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Go to "Dashboard" → "Connection Details"
4. Copy the connection string (it should look like: `postgresql://username:password@hostname/database?sslmode=require`)

## 2. Database Setup

1. **Run the SQL schema**: Copy all contents from `sql/schema.sql` and paste into your Neon SQL Editor
2. **Verify setup**: Visit `http://localhost:3000/api/test-db` to check if tables were created correctly

## 3. Test Registration

1. Go to `http://localhost:3000/signup`
2. Fill out the form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Role: Admin
3. Click "Create Account"

## 4. Troubleshooting

### If registration fails:

1. **Check database connection**: Visit `/api/test-db` in your browser
2. **Check console logs**: Look for errors in the terminal running `npm run dev`
3. **Verify environment variables**: Make sure `.env.local` exists and has correct DATABASE_URL

### Common issues:

- **"DATABASE_URL environment variable is not set"**: Create `.env.local` file
- **"relation does not exist"**: Run the SQL schema in Neon
- **"Registration failed"**: Check `/api/test-db` for database status

### If everything fails, create a simple admin account manually:

Run this in Neon SQL Editor:
```sql
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewjMQY3Mn8zGO0Q.', 'Admin', 'admin');
```

Then login with:
- Email: admin@test.com  
- Password: admin123 