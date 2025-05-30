# SoftShop - Modern E-commerce Platform

A feature-rich e-commerce platform built with React.js and Express.js, designed to provide a seamless shopping experience with advanced features and a visually appealing frosted glass UI design.

## 🚀 Features

- **Modern Responsive UI**: Frosted glass design with dark/light theme support
- **Multi-role Authentication**: Support for customers, vendors, and administrators
- **Product Management**: Full CRUD operations for products with categories and ratings
- **Shopping Cart**: Dynamic cart management with real-time updates
- **Order Processing**: Complete order lifecycle management
- **Vendor Dashboard**: Dedicated interface for vendors to manage their products
- **Admin Panel**: Comprehensive admin controls for user and vendor management
- **Real-time Updates**: Live data synchronization across the platform

## 🛠️ Tech Stack

### Frontend
- **React.js 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Framer Motion** for animations
- **TanStack Query** for state management
- **Wouter** for routing
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** for data persistence
- **Passport.js** for authentication
- **bcrypt** for password hashing
- **Express Session** for session management

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd softshop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=your_postgresql_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🚀 Deployment

### Vercel Deployment

This project is optimized for Vercel deployment with zero configuration required.

#### Prerequisites
- A PostgreSQL database (Neon, Supabase, or any PostgreSQL provider)
- Environment variables configured

#### Deploy to Vercel

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration from `vercel.json`

3. **Configure Environment Variables:**
   In your Vercel project dashboard, add the following environment variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SESSION_SECRET=your_session_secret
   NODE_ENV=production
   ```

4. **Deploy:**
   Click "Deploy" and Vercel will build and deploy your application automatically.

#### Environment Variables Required for Production

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SESSION_SECRET` | Secret key for session encryption | Yes |
| `NODE_ENV` | Environment (set to 'production') | Yes |

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - Type checking

## 🏗️ Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   └── main.tsx       # Application entry point
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── vite.ts           # Vite integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle database schema
├── vercel.json          # Vercel deployment configuration
└── package.json         # Dependencies and scripts
```

## 🔐 Authentication

The application supports three user roles:

1. **Customer**: Can browse products, add to cart, and place orders
2. **Vendor**: Can manage their own products and view sales analytics
3. **Admin**: Full system access including user and vendor management

Default admin credentials:
- Email: `admin@gmail.com`
- Password: `admin123`

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User authentication and profile data
- `vendor_profiles` - Vendor-specific information
- `products` - Product catalog
- `cart` - Shopping cart items
- `orders` - Order history and status
- `ratings` - Product ratings and reviews
- `settings` - Application configuration

## 🎨 UI Components

Built with Shadcn/ui components including:
- Modal dialogs for product details, cart, and authentication
- Responsive navigation with search functionality
- Product cards with ratings and vendor information
- Admin and vendor dashboards
- Form components with validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues during deployment or development:

1. Check that all environment variables are properly configured
2. Ensure your PostgreSQL database is accessible
3. Verify that the database schema has been pushed using `npm run db:push`
4. Check the Vercel deployment logs for specific error messages

For additional support, please open an issue in the GitHub repository.