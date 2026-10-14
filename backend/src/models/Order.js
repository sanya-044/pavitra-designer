import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
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
    price: { type: Number, required: true },
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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    retailerName: {
      type: String,
      required: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (val) => val.length > 0,
        'Order must contain at least one saree item.'
      ]
    },
    totalUnits: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0
    },
    shippingAmount: {
      type: Number,
      required: true,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    shippingAddress: {
      addressLine: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true }
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_production', 'dispatched', 'in_transit', 'delivered', 'cancelled'],
      default: 'confirmed',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'credit_invoice', 'paid', 'failed'],
      default: 'credit_invoice'
    },
    inquiryReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inquiry',
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ''
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
    toObject: { virtuals: true }
  }
);

// Virtual getters matching Frontend UI format
orderSchema.virtual('formattedSubtotal').get(function () {
  return `₹${Number(this.subtotal).toLocaleString('en-IN')}`;
});

orderSchema.virtual('formattedGrandTotal').get(function () {
  return `₹${Number(this.grandTotal).toLocaleString('en-IN')}`;
});

export function generateOrderNumber() {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `#PV-ORD-${randomSuffix}`;
}

const Order = mongoose.model('Order', orderSchema);

export default Order;
