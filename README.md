# JMSS Dashboard

A modern, full-featured swimming school management dashboard built with Next.js, React, TypeScript, and NeonDB. This application provides a content management system with user authentication and an intuitive editor interface.

## Features

### 🏊‍♀️ Dashboard Features
- **Module-based organization** - Content organized into logical modules (Swim Programs, Procedures, etc.)
- **Search functionality** - Real-time search across all content
- **Dark/Light theme** - Toggle between dark and light modes
- **Responsive design** - Works seamlessly on desktop and mobile

### 👥 User Management
- **Role-based access control** - Admin, Editor, and User roles
- **Secure authentication** - JWT-based authentication with bcrypt password hashing
- **User sessions** - Persistent login sessions

### ✏️ Content Editor
- **Rich content types** - Multiple built-in container types:
  - Text blocks
  - Ordered/unordered lists
  - Step-by-step procedures with icons
  - Warning/Success/Danger boxes
  - Interactive quizzes
  - Data grids
  - Tabbed content
- **Visual editor** - WYSIWYG interface for different content types
- **Draft/Publish workflow** - Content can be saved as drafts or published
- **Version history** - Track changes over time

### 🗄️ Database Features
- **NeonDB integration** - Serverless PostgreSQL database
- **Flexible content storage** - JSONB for dynamic content structures
- **Content versioning** - Full audit trail of changes
- **Relational structure** - Proper relationships between users, sections, and content

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: NeonDB (PostgreSQL)
- **Authentication**: JWT with bcryptjs
- **Icons**: Lucide React
- **Development**: ESLint, PostCSS

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── content/           # Content management endpoints
│   │   └── sections/          # Section management endpoints
│   ├── components/            # React components
│   │   ├── Header.tsx         # Navigation header
│   │   ├── ModuleGrid.tsx     # Dashboard module grid
│   │   ├── LoginForm.tsx      # User login form
│   │   ├── ContentEditor.tsx  # Content editing interface
│   │   └── ContentList.tsx    # Content listing component
│   ├── editor/                # Editor dashboard pages
│   ├── providers/             # React context providers
│   │   ├── auth-provider.tsx  # Authentication context
│   │   └── theme-provider.tsx # Theme management
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── lib/
│   ├── db.ts                 # Database connection and types
│   └── auth.ts               # Authentication utilities
├── sql/
│   └── schema.sql            # Database schema and initial data
└── package.json              # Dependencies and scripts
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=your_neon_database_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 2. Database Setup

1. **Create a NeonDB account** at [neon.tech](https://neon.tech)
2. **Create a new database** and copy the connection string
3. **Run the schema** to set up tables and initial data:
   ```sql
   -- Copy and paste the contents of sql/schema.sql into your NeonDB SQL editor
   ```

### 3. Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Default Login

The application creates a default admin user:
- **Email**: `admin@jmss.com`
- **Password**: `admin123`

## Content Container Types

The editor supports various content container types:

### Text Block
Simple rich text content with formatting support.

### List Container
- Ordered or unordered lists
- Add/remove items dynamically
- Support for nested content

### Procedure Steps
- Step-by-step instructions
- Custom icons for each step
- Detailed descriptions

### Alert Boxes
- **Warning**: Important notices
- **Success**: Confirmation messages
- **Danger**: Critical alerts

### Quiz Container
- Multiple choice questions
- Interactive answer selection
- Results tracking

### Data Grid
- Tabular data display
- Sortable columns
- Responsive design

### Tab Container
- Organized content sections
- Easy navigation between tabs
- Nested content support

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Content Management
- `GET /api/content` - List all content items
- `POST /api/content` - Create new content
- `PUT /api/content/[id]` - Update existing content
- `DELETE /api/content/[id]` - Delete content

### Sections
- `GET /api/sections` - List all sections

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Schema

The application uses the following main tables:
- `users` - User accounts and authentication
- `sections` - Content organization categories
- `content_items` - Main content storage with JSONB
- `content_containers` - Available container types
- `content_history` - Version tracking
- `user_sessions` - Session management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please contact the development team or create an issue in the repository. 