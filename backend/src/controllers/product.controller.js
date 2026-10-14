import mongoose from 'mongoose';
import Product from '../models/Product.js';

/**
 * @route   GET /api/products
 * @desc    List active saree catalog listings with search, filter, sort, and pagination
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const { q, category, fabric, minPrice, maxPrice, sort, page, limit } = req.query;

    const query = { isActive: true };

    // Search by text query on title or origin
    if (q && q.trim()) {
      const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedQ, $options: 'i' } },
        { origin: { $regex: escapedQ, $options: 'i' } },
        { fabric: { $regex: escapedQ, $options: 'i' } }
      ];
    }

    // Category filter (support 'All' or specific category)
    if (category && category !== 'All') {
      query.category = category;
    }

    // Fabric filter
    if (fabric && fabric !== 'All') {
      query.fabric = fabric;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };
    else if (sort === 'rating_desc') sortOptions = { rating: -1, createdAt: -1 };
    else if (sort === 'newest') sortOptions = { createdAt: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'name businessName isVerified')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully.',
      data: {
        products: products.map((p) => p.toJSON()),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/categories
 * @desc    Get distinct active saree categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    // Guarantee core traditional categories are always available
    const defaultCategories = ['Banarasi', 'Kanchipuram', 'Chanderi', 'Organza'];
    const merged = Array.from(new Set([...defaultCategories, ...categories]));

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully.',
      data: {
        categories: merged
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by MongoDB ObjectId
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const product = await Product.findById(id).populate('seller', 'name businessName isVerified');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or has been discontinued.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product details retrieved successfully.',
      data: {
        product: product.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get single product by SEO-friendly slug
 * @access  Public
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, isActive: true }).populate(
      'seller',
      'name businessName isVerified'
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with the requested slug.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product details retrieved successfully.',
      data: {
        product: product.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products
 * @desc    Create a new saree listing (Admin or Seller only)
 *          Owner seller is automatically assigned from req.user
 * @access  Private ('admin', 'seller')
 */
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, fabric, origin, image, images, price, moq, stock } = req.body;

    // Derived from authenticated user — never trusted from client
    const sellerId = req.user._id || req.user.id;

    const product = await Product.create({
      name,
      description: description || '',
      category,
      fabric: fabric || 'Silk',
      origin,
      image,
      images: images && images.length > 0 ? images : [image],
      price: Number(price),
      moq: Number(moq) || 5,
      stock: Number(stock) || 50,
      seller: sellerId,
      isActive: true
    });

    const populated = await Product.findById(product._id).populate('seller', 'name businessName isVerified');

    res.status(201).json({
      success: true,
      message: 'Saree listing created successfully.',
      data: {
        product: populated.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/products/:id
 * @desc    Update saree listing (Admin or Owner Seller only)
 * @access  Private ('admin', 'seller')
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Ownership check: Admin can edit any product; Seller can edit ONLY their own products
    const isOwner = product.seller.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to modify another weaver\'s listing.'
      });
    }

    // Apply allowed updates
    const updatableFields = [
      'name',
      'description',
      'category',
      'fabric',
      'origin',
      'image',
      'images',
      'price',
      'moq',
      'stock',
      'isActive'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    const updated = await Product.findById(id).populate('seller', 'name businessName isVerified');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: {
        product: updated.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Soft delete (deactivate) saree listing (Admin or Owner Seller only)
 * @access  Private ('admin', 'seller')
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Ownership check
    const isOwner = product.seller.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to deactivate this saree listing.'
      });
    }

    // Soft delete: sets isActive to false so historical orders remain valid
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product listing successfully deactivated from the catalog.',
      data: {
        id: product._id
      }
    });
  } catch (error) {
    next(error);
  }
};
