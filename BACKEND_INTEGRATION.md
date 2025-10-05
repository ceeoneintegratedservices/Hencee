# Backend Integration Guide for Cloudinary Images

## 1. Frontend Sends Image URLs

When creating inventory items, your frontend now sends Cloudinary URLs instead of base64 data:

```json
{
  "name": "Michelin Tire 205/55R16",
  "category": "Tires",
  "price": 150.00,
  "costPrice": 120.00,
  "stock": 50,
  "reorderLevel": 10,
  "description": "High-quality tire for all weather conditions",
  "images": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/inventory/tire_main.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/inventory/tire_side.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/inventory/tire_tread.jpg"
  ],
  "mainImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/inventory/tire_main.jpg"
}
```

## 2. Backend API Endpoints

Your backend should accept these image URLs in your inventory creation endpoints:

### POST /inventory
```typescript
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
  images?: string[];           // Array of Cloudinary URLs
  mainImage?: string;          // Primary image URL
}
```

### Example Backend Handler (Node.js/Express)
```typescript
app.post('/inventory', async (req, res) => {
  try {
    const { name, category, price, costPrice, stock, reorderLevel, description, images, mainImage } = req.body;
    
    // Validate required fields
    if (!name || !category || !price || !costPrice || !stock) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate image URLs (optional)
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
      images: images || [],
      mainImage: mainImage || (images && images[0]) || null,
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

## 3. Database Schema

Your database should store the image URLs:

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
  images JSONB,              -- Array of image URLs
  main_image VARCHAR(500),  -- Primary image URL
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4. Image Optimization Benefits

With Cloudinary URLs, you get automatic optimization:

### Responsive Images
```html
<!-- Different sizes for different devices -->
<img src="https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300,c_fill/inventory/tire_main.jpg" 
     alt="Tire" 
     srcset="
       https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300,c_fill/inventory/tire_main.jpg 300w,
       https://res.cloudinary.com/your-cloud/image/upload/w_600,h_600,c_fill/inventory/tire_main.jpg 600w,
       https://res.cloudinary.com/your-cloud/image/upload/w_900,h_900,c_fill/inventory/tire_main.jpg 900w
     "
     sizes="(max-width: 600px) 300px, (max-width: 900px) 600px, 900px" />
```

### Format Optimization
```html
<!-- Automatic format selection (WebP, AVIF when supported) -->
<img src="https://res.cloudinary.com/your-cloud/image/upload/f_auto,q_auto/inventory/tire_main.jpg" />
```

### Quality Optimization
```html
<!-- Automatic quality based on content -->
<img src="https://res.cloudinary.com/your-cloud/image/upload/q_auto/inventory/tire_main.jpg" />
```

## 5. Security Considerations

1. **Validate Image URLs**: Ensure URLs are from your Cloudinary account
2. **Rate Limiting**: Implement rate limiting on image upload endpoints
3. **File Size Limits**: Cloudinary handles this, but monitor usage
4. **Access Control**: Use signed uploads for production

## 6. Cost Optimization

1. **Use Auto Format**: `f_auto` automatically selects the best format
2. **Use Auto Quality**: `q_auto` optimizes quality based on content
3. **Responsive Images**: Generate multiple sizes only when needed
4. **Lazy Loading**: Implement lazy loading for better performance

## 7. Error Handling

```typescript
// Frontend error handling
try {
  const result = await uploadImage(file, {
    folder: 'inventory',
    transformation: { width: 800, height: 600, crop: 'fill' }
  });
  setMainImage(result.secure_url);
} catch (error) {
  if (error.message.includes('File too large')) {
    showError('File too large', 'Please select an image smaller than 10MB');
  } else if (error.message.includes('Invalid format')) {
    showError('Invalid format', 'Please select a JPEG, PNG, or WebP image');
  } else {
    showError('Upload failed', 'Please try again');
  }
}
```

## 8. Testing

Test the integration:

1. **Upload Test**: Try uploading different image formats and sizes
2. **URL Validation**: Ensure only valid Cloudinary URLs are accepted
3. **Error Handling**: Test with invalid files and network issues
4. **Performance**: Monitor upload times and success rates

This setup provides a robust, scalable solution for image handling in your inventory management system!
