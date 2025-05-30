import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertProductSchema, insertCartSchema, insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search } = req.query;
      const products = await storage.getProducts(category as string, search as string);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.get("/api/cart/count", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const count = await storage.getCartCount(userId);
      res.json(count);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart count" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const cartData = insertCartSchema.parse({ ...req.body, user_id: userId });
      await storage.addToCart(cartData);
      res.json({ message: "Item added to cart" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:productId", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await storage.updateCartItem(userId, productId, quantity);
      res.json({ message: "Cart updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  app.delete("/api/cart/:productId", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      const { productId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await storage.removeFromCart(userId, productId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Order routes
  app.post("/api/orders/checkout", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const order = await storage.createOrder(userId, req.body);
      
      // Automatically fulfill order after 30 seconds
      setTimeout(async () => {
        try {
          await storage.updateOrderStatus(order.id, 'fulfilled');
        } catch (error) {
          console.error('Failed to auto-fulfill order:', error);
        }
      }, 30000);

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Checkout failed" });
    }
  });

  app.get("/api/user/orders", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders/:orderId/rate", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      const { orderId } = req.params;
      const { rating, comment } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      await storage.rateOrder(userId, orderId, rating, comment);
      res.json({ message: "Rating submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/user/profile", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const updateData = req.body;
      const user = await storage.updateUser(userId, updateData);
      
      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Vendor routes
  app.get("/api/vendor/stats", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const stats = await storage.getVendorStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor stats" });
    }
  });

  // Vendor profile routes
  app.get("/api/vendor/profile", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const profile = await storage.getVendorProfile(userId);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor profile" });
    }
  });

  app.put("/api/vendor/profile", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const profile = await storage.updateVendorProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update vendor profile" });
    }
  });

  app.get("/api/vendor/products", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const products = await storage.getVendorProducts(userId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor products" });
    }
  });

  app.post("/api/vendor/products", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const productData = { ...req.body, vendor_id: userId };
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/vendor/products/:id", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      const productId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verify the product belongs to this vendor
      const existingProduct = await storage.getProductById(productId);
      if (!existingProduct || existingProduct.vendor_id !== userId) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const product = await storage.updateProduct(productId, req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/vendor/products/:id", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      const productId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verify the product belongs to this vendor
      const existingProduct = await storage.getProductById(productId);
      if (!existingProduct || existingProduct.vendor_id !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/vendors", async (req, res) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get("/api/admin/products", async (req, res) => {
    try {
      const products = await storage.getAllProductsForAdmin();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.updateUser(userId, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Order tracking routes
  app.get("/api/orders/user", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders/rate", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { orderId, rating, comment } = req.body;
      await storage.rateOrder(userId, orderId, rating, comment);
      res.json({ message: "Rating submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  // Product rating route
  app.get("/api/products/:id/rating", async (req, res) => {
    try {
      const productId = req.params.id;
      const rating = await storage.getProductRating(productId);
      res.json(rating);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product rating" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
