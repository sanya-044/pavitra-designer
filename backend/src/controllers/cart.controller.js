import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * Helper to compute cart totals using fresh server-side product data.
 * Filters out deleted or inactive products safely.
 */
export const formatCartResponse = (cart) => {
  let subtotal = 0;
  let totalUnits = 0;

  const validItems = [];

  for (const item of cart.items) {
    if (item.product && item.product.isActive !== false) {
      const unitPrice = item.product.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      totalUnits += item.quantity;

      validItems.push({
        product: {
          id: item.product._id || item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          category: item.product.category,
          fabric: item.product.fabric,
          origin: item.product.origin,
          image: item.product.image,
          price: item.product.price,
          formattedPrice: `₹${Number(item.product.price).toLocaleString('en-IN')}/pc`,
          moq: item.product.moq,
          formattedMoq: `${item.product.moq} pcs`,
          stock: item.product.stock,
          seller: item.product.seller
        },
        quantity: item.quantity,
        itemTotal,
        formattedItemTotal: `₹${Number(itemTotal).toLocaleString('en-IN')}`
      });
    }
  }

  // Estimated GST (5% standard for Indian textiles)
  const estimatedTax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + estimatedTax;

  return {
    id: cart._id || cart.id,
    items: validItems,
    totalUnits,
    subtotal,
    formattedSubtotal: `₹${Number(subtotal).toLocaleString('en-IN')}`,
    estimatedTax,
    formattedEstimatedTax: `₹${Number(estimatedTax).toLocaleString('en-IN')}`,
    grandTotal,
    formattedGrandTotal: `₹${Number(grandTotal).toLocaleString('en-IN')}`
  };
};

/**
 * @route   GET /api/cart
 * @desc    Get current user's inquiry bag / cart with recalculated server totals
 * @access  Private
 */
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully.',
      data: {
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart or update existing quantity (enforcing MOQ and stock)
 * @access  Private
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, quantity } = req.body;

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
        message: 'Product not found or is currently discontinued.'
      });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    let targetQuantity = Number(quantity);

    if (itemIndex > -1) {
      // If already in cart, increment quantity
      targetQuantity = cart.items[itemIndex].quantity + Number(quantity);
    }

    // Enforce MOQ check
    if (targetQuantity < product.moq) {
      return res.status(400).json({
        success: false,
        message: `Quantity (${targetQuantity}) does not meet the Minimum Order Quantity (MOQ) of ${product.moq} pieces.`
      });
    }

    // Enforce stock availability
    if (targetQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${targetQuantity}) exceeds available weaver loom stock (${product.stock} pieces).`
      });
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = targetQuantity;
    } else {
      cart.items.push({ product: product._id, quantity: targetQuantity });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item added to inquiry bag successfully.',
      data: {
        cart: formatCartResponse(populatedCart)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/cart/items/:productId
 * @desc    Change item quantity in cart directly
 * @access  Private
 */
export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const newQuantity = Number(quantity);

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or is discontinued.'
      });
    }

    // Enforce MOQ
    if (newQuantity < product.moq) {
      return res.status(400).json({
        success: false,
        message: `Quantity (${newQuantity}) cannot be lower than the product MOQ of ${product.moq} pieces.`
      });
    }

    // Enforce stock
    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity (${newQuantity}) exceeds available stock of ${product.stock} pieces.`
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.'
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'This product is not present in your cart.'
      });
    }

    cart.items[itemIndex].quantity = newQuantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Cart item quantity updated successfully.',
      data: {
        cart: formatCartResponse(populatedCart)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    Remove single product item from cart
 * @access  Private
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.'
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      data: {
        cart: formatCartResponse(populatedCart)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/cart
 * @desc    Clear all items in user's cart
 * @access  Private
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry bag cleared successfully.',
      data: {
        cart: {
          items: [],
          totalUnits: 0,
          subtotal: 0,
          formattedSubtotal: '₹0',
          estimatedTax: 0,
          formattedEstimatedTax: '₹0',
          grandTotal: 0,
          formattedGrandTotal: '₹0'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
