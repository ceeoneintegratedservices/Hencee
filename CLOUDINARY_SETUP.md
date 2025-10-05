# Cloudinary Setup Guide

## 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. Once logged in, go to your dashboard to get your credentials

## 2. Get Your Cloudinary Credentials

From your Cloudinary dashboard, you'll need:
- **Cloud Name**: Found in the dashboard
- **API Key**: Found in the dashboard  
- **API Secret**: Found in the dashboard (keep this secret!)

## 3. Environment Variables

Create a `.env.local` file in your project root with:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://ceeone-api.onrender.com

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dvgzqiksi
NEXT_PUBLIC_CLOUDINARY_API_KEY=626128338556469
CLOUDINARY_API_SECRET=your_api_secret_here

# Upload Preset for unsigned uploads (REQUIRED for client-side uploads)
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

## 4. Create Upload Preset (REQUIRED)

You need to create an upload preset in your Cloudinary dashboard for client-side uploads:

1. **Go to your Cloudinary Dashboard**
2. **Navigate to Settings → Upload**
3. **Click "Add upload preset"**
4. **Configure the preset:**
   - **Preset name**: `ml_default` (or any name you prefer)
   - **Signing Mode**: `Unsigned` (this allows client-side uploads)
   - **Folder**: `inventory` (optional, for organization)
   - **Access Mode**: `Public`
   - **Auto-format**: `On`
   - **Quality**: `Auto`

5. **Save the preset**

## 5. Update Environment Variables

Add the upload preset name to your `.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

## 5. Backend Integration

Your backend should accept image URLs in the inventory creation payload:

```json
{
  "name": "Product Name",
  "category": "Tires",
  "price": 100.00,
  "costPrice": 80.00,
  "stock": 50,
  "reorderLevel": 10,
  "description": "Product description",
  "images": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/product1.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/product2.jpg"
  ],
  "mainImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/product1.jpg"
}
```

## 6. Image Optimization

Cloudinary automatically provides:
- **Responsive images** with different sizes
- **Format optimization** (WebP, AVIF when supported)
- **Quality optimization** based on content
- **Lazy loading** support
- **CDN delivery** for fast loading

## 7. Usage in Components

```typescript
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

const { uploadImage, uploadProgress } = useCloudinaryUpload();

const handleImageUpload = async (file: File) => {
  try {
    const result = await uploadImage(file, {
      folder: 'inventory',
      transformation: { width: 800, height: 600, crop: 'fill' }
    });
    console.log('Image URL:', result.secure_url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## 8. Security Best Practices

1. **Never expose API Secret** in client-side code
2. **Use upload presets** for unsigned uploads when possible
3. **Set up upload restrictions** in Cloudinary dashboard
4. **Use signed uploads** for production
5. **Implement server-side validation** of uploaded images

## 9. Cost Optimization

- Use **auto format** and **auto quality** for optimal file sizes
- Implement **lazy loading** for images
- Use **responsive images** with appropriate sizes
- Consider **WebP format** for better compression
