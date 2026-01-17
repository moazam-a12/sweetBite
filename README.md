# SweetBite

**SweetBite** is a comprehensive dessert shop management system that provides role-based access control for different types of users in a restaurant/dessert shop environment. The system features a modern web interface with dedicated dashboards for customers, staff, and management.

## Features

### Multi-Role System
- **Customer**: Browse menu, place orders, track order status, view order history
- **Chef**: View incoming orders, update cooking status, manage order queue
- **Cashier**: Process payments, handle walk-in orders, generate receipts
- **Delivery**: View assigned deliveries, update delivery status, route optimization
- **Inventory**: Manage products, stock levels, add new items
- **Manager**: Analytics dashboard, user management, inventory oversight, order management

### Core Functionality
- **Order Management**: Full order lifecycle from placement to delivery
- **User Authentication**: Secure login/signup with JWT tokens
- **Analytics Dashboard**: Sales analytics, inventory reports, user statistics
- **Responsive Design**: Mobile-friendly interface for all user roles
- **Image Management**: Cloudinary integration for product images
- **Payment Processing**: Integrated checkout system
- **Inventory Tracking**: Real-time stock management
- **Delivery Management**: Order tracking and delivery assignments

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Cloudinary** for image storage
- **Google Drive API** for file management
- **Multer** for file uploads
- **CORS** enabled for cross-origin requests

### Frontend
- **Vanilla JavaScript** (ES6+)
- **HTML5** semantic markup
- **CSS3** with modern styling
- **Responsive Design** principles
- **Modular Architecture** with separate dashboards

## Project Structure

```
SweetBite/
├── backend/                 # Node.js backend
│   ├── config/             # Configuration files
│   │   ├── cloudinary.js   # Cloudinary setup
│   │   ├── db.js          # Database connection
│   │   └── googleDrive.js # Google Drive integration
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js        # JWT authentication
│   │   ├── role.js        # Role-based access control
│   │   └── upload.js      # File upload handling
│   ├── models/            # MongoDB schemas
│   │   ├── User.js        # User model
│   │   ├── Product.js     # Product model
│   │   ├── Order.js       # Order model
│   │   ├── Stock.js       # Inventory model
│   │   └── PurchaseStats.js # Analytics model
│   ├── routes/            # API endpoints
│   │   ├── auth.js        # Authentication routes
│   │   ├── products.js    # Product management
│   │   ├── orders.js      # Order processing
│   │   ├── customer.js    # Customer-specific routes
│   │   ├── chef.js        # Chef dashboard routes
│   │   ├── cashier.js     # Cashier operations
│   │   ├── delivery.js    # Delivery management
│   │   ├── inventory.js   # Inventory operations
│   │   ├── manager.js     # Management dashboard
│   │   └── users.js       # User management
│   ├── services/          # External services
│   │   └── service-account.json.example # Google service account template
│   ├── .env.example       # Environment variables template
│   ├── package.json       # Dependencies and scripts
│   └── server.js          # Main application entry point
├── frontend/              # Client-side application
│   ├── cashier/           # Cashier dashboard
│   ├── chef/              # Chef dashboard
│   ├── customer/          # Customer interface
│   ├── delivery/          # Delivery dashboard
│   ├── inventory/         # Inventory management
│   ├── manager/           # Manager dashboard
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   ├── index.html         # Landing page
│   ├── login.html         # Authentication pages
│   └── signup.html        # User registration
└── .gitignore             # Git ignore rules
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd SweetBite
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sweetbite
   JWT_SECRET=your_secret_key_here
   PORT=5001
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_KEY=your_cloudinary_key
   CLOUDINARY_SECRET=your_cloudinary_secret
   ```

4. **Set up Google Drive API (Optional)**
   - Create a service account in Google Cloud Console
   - Download the service account JSON file
   - Rename it to `service-account.json` and place it in `backend/services/`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5001`

### Default User Roles
The system includes role-based access control. Users can register and will be assigned a "pending" status initially. Managers can then approve and assign appropriate roles.

## User Interfaces

### Customer Dashboard
- Browse dessert menu with categories
- Add items to cart
- Place orders with delivery information
- Track order status
- View order history
- Account management

### Chef Dashboard
- View incoming orders in real-time
- Update order status (preparing, ready, etc.)
- Manage cooking queue
- View order history
- Order details and special instructions

### Cashier Dashboard
- Process walk-in orders
- Handle payments
- Generate receipts
- View transaction history
- Customer lookup
- Daily sales summary

### Delivery Dashboard
- View assigned deliveries
- Update delivery status
- Customer contact information
- Route optimization suggestions
- Delivery history
- Performance metrics

### Inventory Dashboard
- Add new products
- Manage existing inventory
- Update stock levels
- Product image management
- Category organization
- Stock alerts

### Manager Dashboard
- Sales analytics and reports
- User management and role assignment
- Inventory oversight
- Order management across all statuses
- System statistics
- Performance dashboards

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (inventory role)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get orders (role-based filtering)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status
- `GET /api/orders/:id` - Get specific order

### Role-Specific Endpoints
- `/api/customer/*` - Customer operations
- `/api/chef/*` - Chef dashboard data
- `/api/cashier/*` - Cashier operations
- `/api/delivery/*` - Delivery management
- `/api/inventory/*` - Inventory operations
- `/api/manager/*` - Management functions

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Secure file upload handling

## Design Philosophy

The application follows modern web design principles:
- **Responsive Design**: Mobile-first approach
- **Clean UI**: Apple-inspired design language
- **Role-Based UX**: Tailored interfaces for different user types
- **Consistent Branding**: Unified color scheme and typography
- **Accessibility**: Semantic HTML and ARIA labels

## Deployment

### Environment Setup
1. Set up MongoDB Atlas or configure local MongoDB
2. Configure Cloudinary account for image storage
3. Set up Google Drive API (if using file storage)
4. Update environment variables for production

### Deployment Options
- **Heroku**: Easy deployment with built-in MongoDB add-ons
- **Vercel**: Frontend deployment with serverless functions
- **DigitalOcean**: Full-stack deployment on VPS
- **AWS**: Scalable deployment with EC2/RDS

---

**SweetBite** - Making dessert shop management sweet and simple!
