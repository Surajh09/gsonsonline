# Product Catalogue Website

A modern, responsive product catalogue website built with Next.js, TypeScript, Tailwind CSS, and MongoDB. This application serves as a comprehensive product directory where users can browse products across multiple categories and find purchase links to various e-commerce platforms.

## 🚀 Features

### Core Functionality
- **Product Catalogue**: Browse 100+ products across 20+ categories
- **Search & Filter**: Advanced search and category-based filtering
- **Responsive Design**: Mobile-first design with beautiful UI
- **E-commerce Integration**: Direct links to Amazon, Flipkart, Myntra, Meesho, etc.
- **Category Management**: Organized product categorization
- **Product Details**: Comprehensive product information pages

### Pages
1. **Landing Page** (`/`) - Hero section with company overview and featured content
2. **Explore Page** (`/products`) - Complete product listing with search and filters
3. **Product Detail Page** (`/products/[id]`) - Individual product information
4. **Categories Page** (`/categories`) - All product categories
5. **Category Page** (`/categories/[id]`) - Products within a specific category

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB with Mongoose ODM
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd website
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/product-catalogue

# For MongoDB Atlas (cloud), use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/product-catalogue?retryWrites=true&w=majority
```

### 4. Start MongoDB
If using local MongoDB:
```bash
mongod
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Setup

### Option 1: Seed with Sample Data
To populate your database with sample data:

1. Start the development server
2. Make a POST request to `/api/seed`:
```bash
curl -X POST http://localhost:3000/api/seed
```

Or visit the URL in your browser and use browser dev tools to make the POST request.

### Option 2: Manual Data Entry
Use MongoDB Compass or any MongoDB client to manually add:
- Categories in the `categories` collection
- Products in the `products` collection

## 📊 Database Schema

### Category Model
```typescript
{
  name: string,           // Category name
  description: string,    // Category description
  no_of_items: number,   // Number of products in category
  created_at: Date,
  updated_at: Date
}
```

### Product Model
```typescript
{
  name: string,           // Product name
  description: string,    // Product description
  price: number,          // Product price
  category: ObjectId,     // Reference to category
  available_on: string[], // E-commerce platforms
  links: [{               // Purchase links
    platform: string,
    url: string
  }],
  image_url?: string,     // Optional product image
  created_at: Date,
  updated_at: Date
}
```

## 🎨 UI Components

### Reusable Components
- **Navbar**: Responsive navigation with search
- **ProductCard**: Product display card with purchase links
- **CategoryCard**: Category overview card
- **Loading States**: Skeleton loading animations
- **Error States**: User-friendly error messages

### Design Features
- **Modern UI**: Clean, professional design
- **Responsive**: Mobile-first approach
- **Accessibility**: Semantic HTML and ARIA labels
- **Performance**: Optimized images and lazy loading
- **SEO**: Proper meta tags and structured data

## 🔧 API Routes

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/[id]` - Get specific category

### Products
- `GET /api/products` - Get products (with search, filter, pagination)
- `GET /api/products/[id]` - Get specific product

### Utility
- `POST /api/seed` - Seed database with sample data

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed on any platform that supports Node.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 📱 Usage

### For End Users
1. **Browse Products**: Visit the explore page to see all products
2. **Search**: Use the search bar to find specific products
3. **Filter**: Select categories to filter products
4. **View Details**: Click on any product for detailed information
5. **Purchase**: Click on e-commerce links to buy products

### For Administrators
1. **Add Categories**: Use MongoDB client to add new categories
2. **Add Products**: Add products with proper category references
3. **Update Links**: Maintain e-commerce platform links
4. **Monitor**: Check API responses and error logs

## 🔍 Features in Detail

### Search Functionality
- Full-text search across product names and descriptions
- Real-time search suggestions
- Search persistence across page navigation

### Category System
- Hierarchical category organization
- Category-based product filtering
- Dynamic category statistics

### E-commerce Integration
- Multiple platform support (Amazon, Flipkart, Myntra, Meesho)
- Direct purchase links
- Platform availability indicators

### Performance Optimizations
- Server-side rendering (SSR)
- Image optimization
- Lazy loading
- Efficient database queries with pagination

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ using Next.js and modern web technologies**
