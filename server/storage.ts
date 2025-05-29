import { createClient } from '@supabase/supabase-js';
import { 
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

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(`Supabase environment variables are required. URL: ${supabaseUrl}, KEY: ${supabaseKey ? 'exists' : 'missing'}`);
  }

  return createClient(supabaseUrl, supabaseKey);
}

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
      const supabase = getSupabaseClient();
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (error || !users || users.length === 0) {
        return null;
      }

      const user = users[0];
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
      
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          password_hash: hashedPassword
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // If user is a vendor, create vendor profile
      if (userData.role === 'vendor') {
        await supabase
          .from('vendor_profiles')
          .insert({
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
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return user;
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error('Failed to update user');
    }
  }

  async getProducts(category?: string, search?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: products, error } = await query;

      if (error) {
        console.error('Get products error:', error);
        return [];
      }

      return products || [];
    } catch (error) {
      console.error('Get products error:', error);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

      if (error) {
        console.error('Get categories error:', error);
        return [];
      }

      const categorySet: Set<string> = new Set();
      products.forEach(p => {
        if (p.category) {
          categorySet.add(p.category);
        }
      });
      const categories = Array.from(categorySet);
      return categories;
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  }

  async getVendorProducts(vendorId: string): Promise<Product[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get vendor products error:', error);
        return [];
      }

      return products || [];
    } catch (error) {
      console.error('Get vendor products error:', error);
      return [];
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return newProduct;
    } catch (error) {
      console.error('Create product error:', error);
      throw new Error('Failed to create product');
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return product;
    } catch (error) {
      console.error('Update product error:', error);
      throw new Error('Failed to update product');
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Delete product error:', error);
      throw new Error('Failed to delete product');
    }
  }

  async getCartItems(userId: string): Promise<any[]> {
    try {
      const { data: cartItems, error } = await supabase
        .from('cart')
        .select(`
          user_id,
          product_id,
          quantity,
          products!inner (
            id,
            name,
            price,
            image_url
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Get cart items error:', error);
        return [];
      }

      return cartItems?.map(item => ({
        user_id: item.user_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products
      })) || [];
    } catch (error) {
      console.error('Get cart items error:', error);
      return [];
    }
  }

  async getCartCount(userId: string): Promise<number> {
    try {
      const { data: cartItems, error } = await supabase
        .from('cart')
        .select('quantity')
        .eq('user_id', userId);

      if (error) {
        console.error('Get cart count error:', error);
        return 0;
      }

      return cartItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    } catch (error) {
      console.error('Get cart count error:', error);
      return 0;
    }
  }

  async addToCart(cartItem: InsertCartItem): Promise<void> {
    try {
      // Check if item already exists in cart
      const { data: existing, error: selectError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', cartItem.user_id)
        .eq('product_id', cartItem.product_id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existing) {
        // Update quantity
        const { error: updateError } = await supabase
          .from('cart')
          .update({
            quantity: existing.quantity + (cartItem.quantity || 1)
          })
          .eq('user_id', cartItem.user_id)
          .eq('product_id', cartItem.product_id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Insert new item
        const { error: insertError } = await supabase
          .from('cart')
          .insert(cartItem);

        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      throw new Error('Failed to add item to cart');
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Update cart item error:', error);
      throw new Error('Failed to update cart item');
    }
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw new Error('Failed to remove item from cart');
    }
  }

  async clearCart(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
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
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          items: cartItems,
          total: total.toString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

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
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get user orders error:', error);
        return [];
      }

      return orders || [];
    } catch (error) {
      console.error('Get user orders error:', error);
      return [];
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Update order status error:', error);
      throw new Error('Failed to update order status');
    }
  }

  async getVendorStats(vendorId: string): Promise<any> {
    try {
      // Get vendor's products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('vendor_id', vendorId);

      if (productsError) {
        throw productsError;
      }

      const productIds = products?.map(p => p.id) || [];

      // Get orders containing vendor's products
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, status, items')
        .eq('status', 'fulfilled');

      if (ordersError) {
        throw ordersError;
      }

      // Calculate vendor-specific revenue
      let totalRevenue = 0;
      let totalOrders = 0;

      orders?.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          const vendorItems = order.items.filter((item: any) => 
            productIds.includes(item.product?.id || item.product_id)
          );
          
          if (vendorItems.length > 0) {
            totalOrders++;
            vendorItems.forEach((item: any) => {
              totalRevenue += parseFloat(item.product?.price || '0') * (item.quantity || 0);
            });
          }
        }
      });

      return {
        revenue: totalRevenue.toFixed(2),
        orders: totalOrders,
        products: products?.length || 0,
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
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get vendor count
      const { count: vendorCount, error: vendorError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'vendor')
        .eq('is_active', true);

      // Get product count
      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get total revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'fulfilled');

      const totalRevenue = orders?.reduce((sum, order) => 
        sum + parseFloat(order.total || '0'), 0
      ) || 0;

      return {
        users: userCount || 0,
        vendors: vendorCount || 0,
        products: productCount || 0,
        revenue: totalRevenue.toFixed(0)
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
      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent users
      const { data: recentUsers, error: usersError } = await supabase
        .from('users')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const activity = [];

      if (recentOrders) {
        activity.push(...recentOrders.map(order => ({
          type: 'order',
          message: `Order placed: $${order.total}`,
          timestamp: new Date(order.created_at).toLocaleString()
        })));
      }

      if (recentUsers) {
        activity.push(...recentUsers.map(user => ({
          type: 'user',
          message: `New user registration: ${user.name}`,
          timestamp: new Date(user.created_at).toLocaleString()
        })));
      }

      // Sort by timestamp and return top 10
      return activity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('Get recent activity error:', error);
      return [];
    }
  }
}

export const storage = new SupabaseStorage();