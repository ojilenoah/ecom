import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { 
  users, 
  products, 
  cart, 
  orders, 
  ratings, 
  vendor_profiles, 
  settings,
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder
} from "@shared/schema";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // User authentication
  authenticateUser(email: string, password: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Products
  getProducts(category?: string, search?: string): Promise<Product[]>;
  getCategories(): Promise<string[]>;
  getVendorProducts(vendorId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Cart
  getCartItems(userId: string): Promise<any[]>;
  getCartCount(userId: string): Promise<number>;
  addToCart(cartItem: InsertCartItem): Promise<void>;
  updateCartItem(userId: string, productId: string, quantity: number): Promise<void>;
  removeFromCart(userId: string, productId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Orders
  createOrder(userId: string, orderData: any): Promise<Order>;
  getUserOrders(userId: string): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;

  // Vendor
  getVendorStats(vendorId: string): Promise<any>;

  // Admin
  getAdminStats(): Promise<any>;
  getRecentActivity(): Promise<any[]>;
}

export class SupabaseStorage implements IStorage {
  
  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password_hash, 10);
      
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          password_hash: hashedPassword
        })
        .returning();

      // If user is a vendor, create vendor profile
      if (userData.role === 'vendor') {
        await db
          .insert(vendor_profiles)
          .values({
            user_id: user.id,
            brand_name: userData.name || 'New Vendor',
            contact_email: user.email,
            bio: 'New vendor on SoftShop',
            is_approved: false
          });
      }

      return user;
    } catch (error) {
      console.error('User creation error:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          ...updates,
          updated_at: sql`NOW()`
        })
        .where(eq(users.id, id))
        .returning();

      return user;
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error('Failed to update user');
    }
  }

  async getProducts(category?: string, search?: string): Promise<Product[]> {
    try {
      let query = db
        .select()
        .from(products)
        .where(eq(products.is_active, true));

      const conditions = [eq(products.is_active, true)];

      if (category && category !== 'All') {
        conditions.push(eq(products.category, category));
      }

      if (search) {
        conditions.push(
          sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.description} ILIKE ${`%${search}%`})`
        );
      }

      const result = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.created_at));

      return result;
    } catch (error) {
      console.error('Get products error:', error);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const result = await db
        .selectDistinct({ category: products.category })
        .from(products)
        .where(and(eq(products.is_active, true), sql`${products.category} IS NOT NULL`));

      return result.map(r => r.category).filter(Boolean);
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  }

  async getVendorProducts(vendorId: string): Promise<Product[]> {
    try {
      const result = await db
        .select()
        .from(products)
        .where(eq(products.vendor_id, vendorId))
        .orderBy(desc(products.created_at));

      return result;
    } catch (error) {
      console.error('Get vendor products error:', error);
      return [];
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const [newProduct] = await db
        .insert(products)
        .values(product)
        .returning();

      return newProduct;
    } catch (error) {
      console.error('Create product error:', error);
      throw new Error('Failed to create product');
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const [product] = await db
        .update(products)
        .set({
          ...updates,
          updated_at: sql`NOW()`
        })
        .where(eq(products.id, id))
        .returning();

      return product;
    } catch (error) {
      console.error('Update product error:', error);
      throw new Error('Failed to update product');
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await db
        .delete(products)
        .where(eq(products.id, id));
    } catch (error) {
      console.error('Delete product error:', error);
      throw new Error('Failed to delete product');
    }
  }

  async getCartItems(userId: string): Promise<any[]> {
    try {
      const result = await db
        .select({
          user_id: cart.user_id,
          product_id: cart.product_id,
          quantity: cart.quantity,
          product: {
            id: products.id,
            name: products.name,
            price: products.price,
            image_url: products.image_url
          }
        })
        .from(cart)
        .innerJoin(products, eq(cart.product_id, products.id))
        .where(eq(cart.user_id, userId));

      return result;
    } catch (error) {
      console.error('Get cart items error:', error);
      return [];
    }
  }

  async getCartCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`COALESCE(SUM(${cart.quantity}), 0)` })
        .from(cart)
        .where(eq(cart.user_id, userId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Get cart count error:', error);
      return 0;
    }
  }

  async addToCart(cartItem: InsertCartItem): Promise<void> {
    try {
      // Check if item already exists in cart
      const existing = await db
        .select()
        .from(cart)
        .where(
          and(
            eq(cart.user_id, cartItem.user_id),
            eq(cart.product_id, cartItem.product_id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update quantity
        await db
          .update(cart)
          .set({
            quantity: sql`${cart.quantity} + ${cartItem.quantity || 1}`
          })
          .where(
            and(
              eq(cart.user_id, cartItem.user_id),
              eq(cart.product_id, cartItem.product_id)
            )
          );
      } else {
        // Insert new item
        await db
          .insert(cart)
          .values(cartItem);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      throw new Error('Failed to add item to cart');
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<void> {
    try {
      await db
        .update(cart)
        .set({ quantity })
        .where(
          and(
            eq(cart.user_id, userId),
            eq(cart.product_id, productId)
          )
        );
    } catch (error) {
      console.error('Update cart item error:', error);
      throw new Error('Failed to update cart item');
    }
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    try {
      await db
        .delete(cart)
        .where(
          and(
            eq(cart.user_id, userId),
            eq(cart.product_id, productId)
          )
        );
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw new Error('Failed to remove item from cart');
    }
  }

  async clearCart(userId: string): Promise<void> {
    try {
      await db
        .delete(cart)
        .where(eq(cart.user_id, userId));
    } catch (error) {
      console.error('Clear cart error:', error);
      throw new Error('Failed to clear cart');
    }
  }

  async createOrder(userId: string, orderData: any): Promise<Order> {
    try {
      // Get cart items
      const cartItems = await this.getCartItems(userId);
      
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate total
      const total = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0
      );

      // Create order
      const [order] = await db
        .insert(orders)
        .values({
          user_id: userId,
          items: cartItems,
          total: total.toString(),
          status: 'pending'
        })
        .returning();

      // Clear cart
      await this.clearCart(userId);

      // Simulate payment processing and status updates
      setTimeout(async () => {
        await this.updateOrderStatus(order.id, 'paid');
        
        // Simulate fulfillment after 1 minute
        setTimeout(async () => {
          await this.updateOrderStatus(order.id, 'fulfilled');
        }, 60000);
      }, 2000);

      return order;
    } catch (error) {
      console.error('Create order error:', error);
      throw new Error('Failed to create order');
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const result = await db
        .select()
        .from(orders)
        .where(eq(orders.user_id, userId))
        .orderBy(desc(orders.created_at));

      return result;
    } catch (error) {
      console.error('Get user orders error:', error);
      return [];
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      await db
        .update(orders)
        .set({
          status: status as any,
          updated_at: sql`NOW()`
        })
        .where(eq(orders.id, orderId));
    } catch (error) {
      console.error('Update order status error:', error);
      throw new Error('Failed to update order status');
    }
  }

  async getVendorStats(vendorId: string): Promise<any> {
    try {
      // Get vendor's orders
      const vendorOrders = await db
        .select({
          total: orders.total,
          status: orders.status
        })
        .from(orders)
        .innerJoin(products, sql`${orders.items}::jsonb @> '[{"product_id": "${products.id}"}]'`)
        .where(eq(products.vendor_id, vendorId));

      const totalRevenue = vendorOrders
        .filter(order => order.status === 'fulfilled')
        .reduce((sum, order) => sum + parseFloat(order.total), 0);

      const totalOrders = vendorOrders.length;

      // Get product count
      const productCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(eq(products.vendor_id, vendorId));

      return {
        revenue: totalRevenue.toFixed(2),
        orders: totalOrders,
        products: productCount[0]?.count || 0,
        rating: '4.8' // TODO: Calculate from actual ratings
      };
    } catch (error) {
      console.error('Get vendor stats error:', error);
      return {
        revenue: '0',
        orders: 0,
        products: 0,
        rating: '0'
      };
    }
  }

  async getAdminStats(): Promise<any> {
    try {
      // Get user count
      const userCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(eq(users.is_active, true));

      // Get vendor count
      const vendorCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(and(eq(users.role, 'vendor'), eq(users.is_active, true)));

      // Get product count
      const productCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(eq(products.is_active, true));

      // Get total revenue
      const revenueResult = await db
        .select({ total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)` })
        .from(orders)
        .where(eq(orders.status, 'fulfilled'));

      return {
        users: userCount[0]?.count || 0,
        vendors: vendorCount[0]?.count || 0,
        products: productCount[0]?.count || 0,
        revenue: (revenueResult[0]?.total || 0).toFixed(0)
      };
    } catch (error) {
      console.error('Get admin stats error:', error);
      return {
        users: 0,
        vendors: 0,
        products: 0,
        revenue: '0'
      };
    }
  }

  async getRecentActivity(): Promise<any[]> {
    try {
      // Get recent orders
      const recentOrders = await db
        .select({
          type: sql<string>`'order'`,
          message: sql<string>`CONCAT('Order placed: $', ${orders.total})`,
          timestamp: orders.created_at
        })
        .from(orders)
        .orderBy(desc(orders.created_at))
        .limit(5);

      // Get recent users
      const recentUsers = await db
        .select({
          type: sql<string>`'user'`,
          message: sql<string>`CONCAT('New user registration: ', ${users.name})`,
          timestamp: users.created_at
        })
        .from(users)
        .orderBy(desc(users.created_at))
        .limit(5);

      // Combine and sort
      const activity = [...recentOrders, ...recentUsers]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(item => ({
          ...item,
          timestamp: new Date(item.timestamp).toLocaleString()
        }));

      return activity;
    } catch (error) {
      console.error('Get recent activity error:', error);
      return [];
    }
  }
}

export const storage = new SupabaseStorage();
