import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Standard Indian GSTIN Regex:
 * 2 state digits + 5 PAN letters + 4 PAN digits + 1 PAN letter + 1 entity number + 'Z' + 1 checksum char
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'seller', 'retailer'],
        message: 'Role must be either admin, seller, or retailer'
      },
      default: 'retailer',
      index: true
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    businessName: {
      type: String,
      trim: true,
      default: null
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return GSTIN_REGEX.test(v);
        },
        message: 'Invalid GSTIN format. Standard format: 2 digits + 10-char PAN + 1 char + Z + 1 checksum char'
      }
    },
    businessVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
      index: true
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'pending_approval'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Pre-save hook to hash password whenever modified (async without next for Mongoose 9+)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
