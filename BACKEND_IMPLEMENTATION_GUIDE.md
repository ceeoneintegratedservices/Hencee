# Backend Implementation Guide for Cloudinary Images

## 🎯 **What Your Backend Needs to Do**

Your backend should accept and store the Cloudinary image URLs that your frontend sends. Here's exactly what to implement:

## 1. **Update Your Inventory Creation Endpoint**

### **Current Endpoint**: `POST /inventory`
### **What to Change**: Accept `images` and `mainImage` fields

```typescript
// Before (what you probably have now)
interface CreateInventoryRequest {
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  reorderLevel: number;
  description?: string;
  sku?: string;
  barcode?: string;
  supplier?: string;
}

// After (what you need to add)
interface CreateInventoryRequest {
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  reorderLevel: number;
  description?: string;
  sku?: string;
  barcode?: string;
  supplier?: string;
  images?: string[];           // NEW: Array of Cloudinary URLs
  mainImage?: string;         // NEW: Primary image URL
}
```

## 2. **Update Your Database Schema**

Add these fields to your inventory table:

```sql
-- Add these columns to your existing inventory table
ALTER TABLE inventory ADD COLUMN images JSONB;
ALTER TABLE inventory ADD COLUMN main_image VARCHAR(500);
```

Or if creating a new table:

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  reorder_level INTEGER DEFAULT 10,
  description TEXT,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  supplier VARCHAR(255),
  images JSONB,              -- Array of Cloudinary URLs
  main_image VARCHAR(500),   -- Primary image URL
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 3. **Update Your Backend Handler**

Here's the exact code to add to your inventory creation endpoint:

```typescript
// Example for Node.js/Express
app.post('/inventory', async (req, res) => {
  try {
    const { 
      name, 
      category, 
      price, 
      costPrice, 
      stock, 
      reorderLevel, 
      description, 
      sku, 
      barcode, 
      supplier,
      images,        // NEW: Array of Cloudinary URLs
      mainImage      // NEW: Primary image URL
    } = req.body;
    
    // Validate required fields
    if (!name || !category || !price || !costPrice || !stock) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate image URLs (optional but recommended)
    if (images && Array.isArray(images)) {
      for (const imageUrl of images) {
        if (!isValidCloudinaryUrl(imageUrl)) {
          return res.status(400).json({ error: 'Invalid image URL' });
        }
      }
    }
    
    // Create inventory item in database
    const inventoryItem = await Inventory.create({
      name,
      category,
      price,
      costPrice,
      stock,
      reorderLevel,
      description,
      sku,
      barcode,
      supplier,
      images: images || [],                    // Store array of URLs
      mainImage: mainImage || (images && images[0]) || null,  // Primary image
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json(inventoryItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to validate Cloudinary URLs
function isValidCloudinaryUrl(url: string): boolean {
  const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.*$/;
  return cloudinaryPattern.test(url);
}
```

## 4. **Update Your Response Models**

Make sure your API responses include the image fields:

```typescript
// Update your inventory response model
interface InventoryResponse {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  reorderLevel: number;
  description?: string;
  sku?: string;
  barcode?: string;
  supplier?: string;
  images: string[];           // Array of Cloudinary URLs
  mainImage?: string;         // Primary image URL
  createdAt: string;
  updatedAt: string;
}
```

## 5. **Update Your Update Endpoint**

Also update your inventory update endpoint to handle images:

```typescript
// PUT /inventory/:id
app.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate image URLs if provided
    if (updateData.images && Array.isArray(updateData.images)) {
      for (const imageUrl of updateData.images) {
        if (!isValidCloudinaryUrl(imageUrl)) {
          return res.status(400).json({ error: 'Invalid image URL' });
        }
      }
    }
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 6. **Example Request/Response**

### **Request from Frontend:**
```json
POST /inventory
{
  "name": "Michelin Tire 205/55R16",
  "category": "Tires",
  "price": 150.00,
  "costPrice": 120.00,
  "stock": 50,
  "reorderLevel": 10,
  "description": "High-quality tire for all weather conditions",
  "images": [
    "https://res.cloudinary.com/dvgzqiksi/image/upload/v1234567890/inventory/tire_main.jpg",
    "https://res.cloudinary.com/dvgzqiksi/image/upload/v1234567890/inventory/tire_side.jpg"
  ],
  "mainImage": "https://res.cloudinary.com/dvgzqiksi/image/upload/v1234567890/inventory/tire_main.jpg"
}
```

### **Response from Backend:**
```json
{
  "id": "uuid-123",
  "name": "Michelin Tire 205/55R16",
  "category": "Tires",
  "price": 150.00,
  "costPrice": 120.00,
  "stock": 50,
  "reorderLevel": 10,
  "description": "High-quality tire for all weather conditions",
  "images": [
    "https://res.cloudinary.com/dvgzqiksi/image/upload/v1234567890/inventory/tire_main.jpg",
    "https://res.cloudinary.com/dvgzqiksi/image/upload/v1234567890/inventory/tire_side.jpg"
  ],
  "mainImage": "https://res.cloudinary.com/dvgzqiksi/image/upload/v1234567890/inventory/tire_main.jpg",
  "createdAt": "2025-01-20T10:30:00Z",
  "updatedAt": "2025-01-20T10:30:00Z"
}
```

## 7. **Testing Your Backend**

Test with curl or Postman:

```bash
curl -X POST http://localhost:5000/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "name": "Test Product",
    "category": "Tires",
    "price": 100.00,
    "costPrice": 80.00,
    "stock": 25,
    "reorderLevel": 5,
    "images": [
      "https://res.cloudinary.com/dvgzqiksi/image/upload/v1234567890/inventory/test.jpg"
    ],
    "mainImage": "https://res.cloudinary.com/dvgzqiksi/image/upload/v1234567890/inventory/test.jpg"
  }'
```

## 8. **Benefits of This Approach**

✅ **No file storage** on your server  
✅ **Automatic optimization** via Cloudinary  
✅ **CDN delivery** for fast loading  
✅ **Responsive images** with transformations  
✅ **Cost effective** (Cloudinary free tier)  
✅ **Scalable** (handles any number of images)  

## 9. **Security Considerations**

- Validate that URLs are from your Cloudinary account
- Consider rate limiting on image uploads
- Monitor Cloudinary usage in dashboard
- Use signed uploads for production

That's it! Your backend just needs to accept and store the Cloudinary URLs. The heavy lifting (image optimization, storage, CDN) is handled by Cloudinary.
