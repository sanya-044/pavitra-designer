import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Saree name is required'],
      trim: true,
      minlength: [3, 'Saree name must be at least 3 characters'],
      maxlength: [150, 'Saree name cannot exceed 150 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Banarasi', 'Kanchipuram', 'Chanderi', 'Organza', 'Silk', 'Cotton'],
        message: 'Invalid category: {VALUE}'
      },
      index: true
    },
    fabric: {
      type: String,
      trim: true,
      default: 'Silk'
    },
    origin: {
      type: String,
      required: [true, 'Origin / Weaver location is required'],
      trim: true,
      index: true
    },
    image: {
      type: String,
      required: [true, 'Primary image URL is required'],
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    price: {
      type: Number,
      required: [true, 'Wholesale price per piece is required'],
      min: [1, 'Price must be greater than 0']
    },
    moq: {
      type: Number,
      required: [true, 'Minimum Order Quantity (MOQ) is required'],
      min: [1, 'MOQ must be at least 1 piece'],
      default: 5
    },
    stock: {
      type: Number,
      required: [true, 'Available stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 50
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot exceed 5.0'],
      default: 4.8
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required'],
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Virtual for formatted price string matching frontend UI: "₹4,500/pc"
productSchema.virtual('formattedPrice').get(function () {
  return `₹${Number(this.price).toLocaleString('en-IN')}/pc`;
});

// Virtual for formatted MOQ string matching frontend UI: "5 pcs"
productSchema.virtual('formattedMoq').get(function () {
  return `${this.moq} pcs`;
});

// Helper function to generate URL slug
export function generateSlug(name) {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pre-save hook to generate unique slug if not present or name modified
productSchema.pre('save', async function () {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = generateSlug(this.name);
    let candidateSlug = baseSlug;
    let count = 1;

    // Check slug uniqueness
    while (await mongoose.models.Product.findOne({ slug: candidateSlug, _id: { $ne: this._id } })) {
      candidateSlug = `${baseSlug}-${count++}`;
    }
    this.slug = candidateSlug;
  }

  // Ensure images array includes primary image if empty
  if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }
});

// Compound indexes for performant search and filter
productSchema.index({ name: 'text', origin: 'text', fabric: 'text' });
productSchema.index({ category: 1, price: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
