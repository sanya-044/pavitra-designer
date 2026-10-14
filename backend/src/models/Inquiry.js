import mongoose from 'mongoose';

const inquiryItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    name: { type: String, required: true },
    category: { type: String, required: true },
    fabric: { type: String, default: 'Silk' },
    origin: { type: String, required: true },
    image: { type: String, required: true },
    catalogPrice: { type: Number, required: true },
    moq: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    quotedPricePerUnit: { type: Number },
    quotedSubtotal: { type: Number },
    quotedTaxAmount: { type: Number, default: 0 },
    quotedGrandTotal: { type: Number },
    sellerNotes: { type: String, trim: true, default: '' },
    quotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quotedAt: { type: Date },
    validUntil: { type: Date }
  },
  { _id: false }
);

const inquirySchema = new mongoose.Schema(
  {
    inquiryNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: {
      type: [inquiryItemSchema],
      required: true,
      validate: [
        (val) => val.length > 0,
        'Inquiry must contain at least one saree item.'
      ]
    },
    totalUnits: { type: Number, required: true, min: 1 },
    estimatedSubtotal: { type: Number, required: true, min: 0 },
    buyerNotes: { type: String, trim: true, default: '' },
    shippingAddress: {
      addressLine: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true }
    },
    status: {
      type: String,
      enum: ['pending', 'quoted', 'accepted', 'rejected', 'expired', 'converted_to_order'],
      default: 'pending',
      index: true
    },
    quotation: { type: quotationSchema, default: null }
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
    toObject: { virtuals: true }
  }
);

export function generateInquiryNumber() {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `#PV-INQ-${randomSuffix}`;
}

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;
