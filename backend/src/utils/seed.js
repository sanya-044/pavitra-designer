import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';

/**
 * 8 Authentic Indian Sarees matching CatalogScreen.jsx and AdminCatalog.jsx mock data
 */
export const seedSarees = [
  {
    name: 'Royal Banarasi Katan Silk Saree',
    category: 'Banarasi',
    fabric: 'Katan Silk',
    moq: 5,
    price: 4500,
    stock: 120,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
    origin: 'Varanasi',
    description: 'Masterfully handwoven royal Banarasi Katan silk saree adorned with intricate gold and silver zari floral kadwa jaal motifs.'
  },
  {
    name: 'Traditional Kanchipuram Zari Brocade',
    category: 'Kanchipuram',
    fabric: 'Mulberry Silk',
    moq: 3,
    price: 6200,
    stock: 80,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600',
    origin: 'Tamil Nadu',
    description: 'Authentic temple-town Kanchipuram silk saree featuring heavy gold zari korvai borders and rich pallu crafted by master artisans.'
  },
  {
    name: 'Handloom Chanderi Cotton Silk',
    category: 'Chanderi',
    fabric: 'Cotton Silk',
    moq: 10,
    price: 2800,
    stock: 200,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600',
    origin: 'Madhya Pradesh',
    description: 'Lightweight translucent handloom Chanderi saree woven with golden ashrafi butis and delicate sheer texture.'
  },
  {
    name: 'Designer Organza Floral Print Saree',
    category: 'Organza',
    fabric: 'Organza Silk',
    moq: 5,
    price: 3400,
    stock: 95,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600',
    origin: 'Surat',
    description: 'Contemporary pastel organza saree featuring hand-painted botanical digital prints with hand-embroidered scalloped borders.'
  },
  {
    name: 'Zari Woven Tissue Silk Banarasi',
    category: 'Banarasi',
    fabric: 'Tissue Silk',
    moq: 5,
    price: 5500,
    stock: 60,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
    origin: 'Varanasi',
    description: 'Opulent tissue silk Banarasi featuring shimmering metallic sheen with traditional meenakari accents.'
  },
  {
    name: 'Temple Border Kanchipuram Silk',
    category: 'Kanchipuram',
    fabric: 'Pure Silk',
    moq: 4,
    price: 7100,
    stock: 45,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600',
    origin: 'Kanchipuram',
    description: 'Timeless heirloom Kanchipuram with auspicious triangular temple motif (gopuram) borders and contrast zari pallu.'
  },
  {
    name: 'Chanderi Gold Foil Printed Saree',
    category: 'Chanderi',
    fabric: 'Cotton Silk',
    moq: 8,
    price: 2400,
    stock: 150,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600',
    origin: 'Chanderi',
    description: 'Elegant festive Chanderi saree featuring all-over gold foil geometric prints and sheer zari patti border.'
  },
  {
    name: 'Organza Embroidered Party Wear Saree',
    category: 'Organza',
    fabric: 'Organza',
    moq: 6,
    price: 4100,
    stock: 75,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600',
    origin: 'Surat',
    description: 'Luxurious party wear organza saree with cut-work pearl embroidery and refined tone-on-tone resham thread work.'
  }
];

export async function runSeed() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('MONGO_URI is not configured in .env');
    process.exit(1);
  }

  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(mongoURI);

    // 1. Ensure a default verified weaver exists as seller
    let seller = await User.findOne({ email: 'varanasi.weavers@pavitra.com' });
    if (!seller) {
      console.log('[Seed] Creating default weaver/seller account...');
      seller = await User.create({
        name: 'Varanasi Master Weavers Co-op',
        email: 'varanasi.weavers@pavitra.com',
        password: 'WeaverPassword123!',
        role: 'seller',
        businessName: 'Varanasi Heritage Handlooms',
        gstin: '09AAAAA0000A1Z5',
        businessVerificationStatus: 'verified',
        accountStatus: 'active'
      });
      console.log('[Seed] Seller account ready:', seller.email);
    }

    // 2. Insert sarees safely without duplicates
    let createdCount = 0;
    let existingCount = 0;

    for (const item of seedSarees) {
      const existing = await Product.findOne({ name: item.name });
      if (existing) {
        existingCount++;
      } else {
        await Product.create({
          ...item,
          seller: seller._id,
          isActive: true
        });
        createdCount++;
      }
    }

    console.log(`[Seed] Completed. Created: ${createdCount}, Already existed: ${existingCount}`);
    await mongoose.disconnect();
    console.log('[Seed] Disconnected cleanly.');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error.message);
    process.exit(1);
  }
}

// Execute directly if run as CLI script
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
