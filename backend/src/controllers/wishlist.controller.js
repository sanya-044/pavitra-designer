import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

/**
 * @route   GET /api/wishlist
 * @desc    Get current user's saved wishlist items (filtering inactive products safely)
 * @access  Private
 */
export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    let wishlist = await Wishlist.findOne({ user: userId }).populate('products');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    // Filter out deleted/inactive sarees
    const activeProducts = wishlist.products
      .filter((p) => p && p.isActive !== false)
      .map((p) => ({
        id: p._id || p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        fabric: p.fabric,
        origin: p.origin,
        image: p.image,
        price: p.price,
        formattedPrice: `₹${Number(p.price).toLocaleString('en-IN')}/pc`,
        moq: p.moq,
        formattedMoq: `${p.moq} pcs`,
        rating: p.rating,
        stock: p.stock
      }));

    res.status(200).json({
      success: true,
      message: 'Wishlist retrieved successfully.',
      data: {
        wishlist: {
          id: wishlist._id || wishlist.id,
          products: activeProducts,
          totalCount: activeProducts.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/wishlist/items
 * @desc    Add saree to user's saved wishlist (prevents duplicate entries)
 * @access  Private
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or has been discontinued.'
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    const alreadyInWishlist = wishlist.products.some(
      (p) => p.toString() === productId.toString()
    );

    if (!alreadyInWishlist) {
      wishlist.products.push(product._id);
      await wishlist.save();
    }

    const populated = await Wishlist.findById(wishlist._id).populate('products');
    const activeProducts = populated.products.filter((p) => p && p.isActive !== false);

    res.status(200).json({
      success: true,
      message: alreadyInWishlist
        ? 'Product is already in your saved wishlist.'
        : 'Product added to wishlist successfully.',
      data: {
        isInWishlist: true,
        totalCount: activeProducts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/wishlist/items/:productId
 * @desc    Remove product from user's wishlist
 * @access  Private
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found.'
      });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId.toString()
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
      data: {
        isInWishlist: false,
        totalCount: wishlist.products.length
      }
    });
  } catch (error) {
    next(error);
  }
};
