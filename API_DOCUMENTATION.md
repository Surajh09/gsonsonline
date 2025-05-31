# Admin API Documentation

This document describes the backend API endpoints for populating and managing your MongoDB database with products and categories.

## 🚀 Quick Start

### 1. Bulk Populate Database

**Endpoint:** `POST /api/admin/populate`

Use this endpoint to populate your database with multiple categories and products at once.

```bash
curl -X POST http://localhost:3000/api/admin/populate \
  -H "Content-Type: application/json" \
  -d @sample-data.json
```

**Request Body:**
```json
{
  "categories": [
    {
      "name": "Electronics",
      "description": "Latest electronic gadgets and devices"
    }
  ],
  "products": [
    {
      "name": "iPhone 15 Pro",
      "description": "Latest Apple iPhone with advanced camera system",
      "price": 134900,
      "category": "Electronics",
      "available_on": ["Amazon", "Flipkart"],
      "links": [
        { "platform": "Amazon", "url": "https://amazon.in/iphone-15-pro" }
      ],
      "image_url": "https://example.com/image.jpg"
    }
  ],
  "clearExisting": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Database populated successfully",
  "data": {
    "categoriesCreated": 8,
    "productsCreated": 17,
    "categories": [...],
    "products": [...]
  }
}
```

---

## 📂 Category Management

### Create Category

**Endpoint:** `POST /api/admin/categories`

```bash
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Latest electronic gadgets and devices"
  }'
```

### Get All Categories

**Endpoint:** `GET /api/admin/categories`

```bash
curl http://localhost:3000/api/admin/categories
```

### Delete Category

**Endpoint:** `DELETE /api/admin/categories?id=CATEGORY_ID`

```bash
curl -X DELETE "http://localhost:3000/api/admin/categories?id=60f7b3b3b3b3b3b3b3b3b3b3"
```

---

## 🛍️ Product Management

### Create Product

**Endpoint:** `POST /api/admin/products`

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "Latest Apple iPhone with advanced camera system",
    "price": 134900,
    "category": "Electronics",
    "available_on": ["Amazon", "Flipkart"],
    "links": [
      { "platform": "Amazon", "url": "https://amazon.in/iphone-15-pro" }
    ],
    "image_url": "https://example.com/image.jpg"
  }'
```

### Get All Products

**Endpoint:** `GET /api/admin/products`

```bash
curl "http://localhost:3000/api/admin/products?page=1&limit=50"
```

### Delete Product

**Endpoint:** `DELETE /api/admin/products?id=PRODUCT_ID`

```bash
curl -X DELETE "http://localhost:3000/api/admin/products?id=60f7b3b3b3b3b3b3b3b3b3b3"
```

---

## 🔧 Using the Sample Data

1. **Use the provided sample data file:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/populate \
     -H "Content-Type: application/json" \
     -d @sample-data.json
   ```

2. **Clear existing data and repopulate:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/populate \
     -H "Content-Type: application/json" \
     -d '{
       "categories": [...],
       "products": [...],
       "clearExisting": true
     }'
   ```

---

## 📋 Data Format Requirements

### Category Object
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

### Product Object
```json
{
  "name": "string (required)",
  "description": "string (required)",
  "price": "number (required)",
  "category": "string (required) - category name or ID",
  "available_on": "array of strings (optional)",
  "links": "array of objects (optional)",
  "image_url": "string (optional)"
}
```

### Link Object
```json
{
  "platform": "string (required)",
  "url": "string (required)"
}
```

---

## 🎯 Example Workflows

### 1. Fresh Database Setup
```bash
# 1. Populate with sample data
curl -X POST http://localhost:3000/api/admin/populate \
  -H "Content-Type: application/json" \
  -d @sample-data.json

# 2. Verify categories were created
curl http://localhost:3000/api/admin/categories

# 3. Verify products were created
curl http://localhost:3000/api/admin/products
```

### 2. Add Individual Items
```bash
# 1. Add a new category
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Gaming", "description": "Gaming accessories and equipment"}'

# 2. Add a product to that category
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PlayStation 5",
    "description": "Next-gen gaming console",
    "price": 49999,
    "category": "Gaming",
    "available_on": ["Amazon", "Flipkart"],
    "links": [{"platform": "Amazon", "url": "https://amazon.in/ps5"}]
  }'
```

### 3. Update Database
```bash
# Clear and repopulate with new data
curl -X POST http://localhost:3000/api/admin/populate \
  -H "Content-Type: application/json" \
  -d '{
    "categories": [...],
    "products": [...],
    "clearExisting": true
  }'
```

---

## ⚠️ Important Notes

1. **Category References:** Products can reference categories by name or MongoDB ObjectId
2. **Duplicate Prevention:** The API prevents duplicate categories and products by name
3. **Auto-counting:** Category item counts are automatically updated when products are added/removed
4. **Error Handling:** All endpoints return detailed error messages for debugging
5. **Validation:** Required fields are validated before database operations

---

## 🔍 Testing the APIs

You can test these endpoints using:
- **cURL** (as shown in examples)
- **Postman** or **Insomnia**
- **Thunder Client** (VS Code extension)
- **Browser** (for GET requests)

Example using JavaScript fetch:
```javascript
// Populate database
const response = await fetch('/api/admin/populate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    categories: [...],
    products: [...],
    clearExisting: false
  })
});

const result = await response.json();
console.log(result);
``` 