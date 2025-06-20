@echo off
set DATABASE_URL=postgresql://neondb_owner:npg_sZcWROjl9i6C@ep-black-frog-a8nomna0-pooler.eastus2.azure.neon.tech/neondb?sslmode=require
set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo Starting JMSS Dashboard with environment variables...
npm run dev 