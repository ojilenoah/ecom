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
  getProductById(id: string): Promise<Product | null>;
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
  getVendorProfile(vendorId: string): Promise<any>;
  updateVendorProfile(vendorId: string, updates: any): Promise<any>;

  // Admin
  getAdminStats(): Promise<any>;
  getRecentActivity(): Promise<any[]>;
  getAllUsers(): Promise<any[]>;
  getAllVendors(): Promise<any[]>;
  getAllProductsForAdmin(): Promise<any[]>;
  deleteUser(id: string): Promise<void>;
  rateOrder(userId: string, orderId: string, rating: number, comment?: string): Promise<void>;
  getProductRating(productId: string): Promise<{ average_rating: number; review_count: number }>;
  
  // Settings
  getAllSettings(): Promise<any>;
  updateSettings(settings: any): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      const supabase = getSupabaseClient();
      
      // Try to add missing columns using direct SQL queries
      const columnsToAdd = [
        { name: 'business_name', type: 'TEXT' },
        { name: 'business_type', type: 'TEXT' },
        { name: 'business_address', type: 'TEXT' },
        { name: 'phone_number', type: 'TEXT' }
      ];

      // Check existing columns first
      try {
        const { data: existingColumns } = await supabase
          .from('vendor_profiles')
          .select('*')
          .limit(1)
          .single();
        console.log('Existing vendor profile structure:', existingColumns ? Object.keys(existingColumns) : 'No data');
      } catch (error) {
        console.log('No existing vendor profiles found');
      }

      // Since direct SQL might not work, we'll handle missing columns in the update method

      // Add default settings
      const defaultSettings = [
        { key: 'site_name', value: 'SoftShop' },
        { key: 'site_description', value: 'Modern E-commerce Platform' },
        { key: 'contact_email', value: 'admin@softshop.com' },
        { key: 'currency', value: 'USD' },
        { key: 'tax_rate', value: '8.5' },
        { key: 'shipping_fee', value: '9.99' },
        { key: 'enable_notifications', value: 'true' },
        { key: 'maintenance_mode', value: 'false' }
      ];

      for (const setting of defaultSettings) {
        try {
          await supabase
            .from('settings')
            .upsert(setting, { onConflict: 'key' });
        } catch (error) {
          // Ignore upsert errors
        }
      }
    } catch (error) {
      console.log('Database initialization completed with some warnings (this is normal)');
    }
  }
  
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      products.forEach((p: any) => {
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
      const supabase = getSupabaseClient();
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

  async getProductById(id: string): Promise<Product | null> {
    try {
      const supabase = getSupabaseClient();
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Product not found
        }
        throw new Error(error.message);
      }

      return product;
    } catch (error) {
      console.error('Get product by ID error:', error);
      return null;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
            image_url,
            vendor_id
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Get cart items error:', error);
        return [];
      }

      return cartItems?.map((item: any) => ({
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
      const supabase = getSupabaseClient();
      const { data: cartItems, error } = await supabase
        .from('cart')
        .select('quantity')
        .eq('user_id', userId);

      if (error) {
        console.error('Get cart count error:', error);
        return 0;
      }

      return cartItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
    } catch (error) {
      console.error('Get cart count error:', error);
      return 0;
    }
  }

  async addToCart(cartItem: InsertCartItem): Promise<void> {
    try {
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
      // Get cart items with vendor information
      const cartItems = await this.getCartItems(userId);
      
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Group items by vendor to create separate orders for each vendor
      const itemsByVendor = cartItems.reduce((acc, item) => {
        const vendorId = item.product.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = [];
        }
        acc[vendorId].push(item);
        return acc;
      }, {} as { [vendorId: string]: any[] });

      // Create separate orders for each vendor
      const orders = [];
      for (const [vendorId, vendorItems] of Object.entries(itemsByVendor) as [string, any[]][]) {
        // Calculate total for this vendor
        const vendorTotal = (vendorItems as any[]).reduce((sum: number, item: any) => 
          sum + (parseFloat(item.product.price) * item.quantity), 0
        );

        console.log(`Creating order for vendor ${vendorId} with total ${vendorTotal}`);

        // Create order for this vendor
        const { data: order, error } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            vendor_id: vendorId,
            items: vendorItems,
            total: vendorTotal.toString(),
            status: 'paid' // Mark as paid immediately for demo
          })
          .select()
          .single();

        if (error) {
          console.error('Create order error for vendor:', vendorId, error);
          throw error;
        }

        orders.push(order);

        // Auto-fulfill order after 30 seconds
        setTimeout(async () => {
          try {
            await this.updateOrderStatus(order.id, 'fulfilled');
          } catch (error) {
            console.error('Failed to auto-fulfill order:', error);
          }
        }, 30000);
      }

      // Clear cart after successful orders
      await this.clearCart(userId);

      // Return the first order (for compatibility)
      return orders[0];
    } catch (error) {
      console.error('Create order error:', error);
      throw new Error('Failed to create order');
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
      
      // Get vendor's products count
      const { count: productCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('is_active', true);

      if (productsError) {
        console.error('Get vendor products count error:', productsError);
      }

      // Get vendor's orders and calculate revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, status')
        .eq('vendor_id', vendorId);

      if (ordersError) {
        console.error('Get vendor orders error:', ordersError);
      }

      console.log(`Vendor ${vendorId} orders:`, orders);

      // Filter paid and fulfilled orders and calculate revenue
      const revenueOrders = orders?.filter(order => order.status === 'paid' || order.status === 'fulfilled') || [];
      const totalRevenue = revenueOrders.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
      const orderCount = revenueOrders.length || 0;

      console.log(`Vendor ${vendorId} stats: ${orderCount} orders, $${totalRevenue} revenue`);

      // Get average rating for vendor's products
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating, products!inner(vendor_id)')
        .eq('products.vendor_id', vendorId);

      if (ratingsError) {
        console.error('Get vendor ratings error:', ratingsError);
      }

      const averageRating = ratings && ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      return {
        revenue: totalRevenue.toFixed(2),
        orders: orderCount,
        products: productCount || 0,
        rating: averageRating.toFixed(1)
      };
    } catch (error) {
      console.error('Get vendor stats error:', error);
      return {
        revenue: "0.00",
        orders: 0,
        products: 0,
        rating: "0.0"
      };
    }
  }

  async getVendorProfile(vendorId: string): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: profile, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw new Error(error.message);
      }

      return profile || {
        business_name: '',
        description: '',
        contact_phone: '',
        business_address: '',
        website: '',
        business_email: ''
      };
    } catch (error) {
      console.error('Get vendor profile error:', error);
      return {
        business_name: '',
        description: '',
        contact_phone: '',
        business_address: '',
        website: '',
        business_email: ''
      };
    }
  }

  async updateVendorProfile(vendorId: string, updates: any): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      
      // Filter out fields that don't exist in the current schema
      const allowedFields = ['brand_name', 'business_name', 'business_type', 'business_address', 'phone_number', 'logo_url', 'contact_email', 'bio', 'is_approved'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      console.log('Attempting to update vendor profile with filtered fields:', Object.keys(filteredUpdates));
      
      // First try to update existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('vendor_profiles')
        .select('user_id')
        .eq('user_id', vendorId)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { data: profile, error } = await supabase
          .from('vendor_profiles')
          .update(filteredUpdates)
          .eq('user_id', vendorId)
          .select()
          .single();

        if (error) {
          console.error('Update profile error:', error);
          throw new Error(error.message);
        }

        return profile;
      } else {
        // Create new profile
        const { data: profile, error } = await supabase
          .from('vendor_profiles')
          .insert({
            user_id: vendorId,
            brand_name: filteredUpdates.brand_name || 'Default Brand',
            ...filteredUpdates
          })
          .select()
          .single();

        if (error) {
          console.error('Create profile error:', error);
          throw new Error(error.message);
        }

        return profile;
      }
    } catch (error) {
      console.error('Update vendor profile error:', error);
      throw new Error('Failed to update vendor profile');
    }
  }

  async getAdminStats(): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      
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
        .eq('status', 'paid');

      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;

      return {
        users: userCount || 0,
        vendors: vendorCount || 0,
        products: productCount || 0,
        revenue: totalRevenue.toFixed(2)
      };
    } catch (error) {
      console.error('Get admin stats error:', error);
      return {
        users: 0,
        vendors: 0,
        products: 0,
        revenue: "0.00"
      };
    }
  }

  async getRecentActivity(): Promise<any[]> {
    try {
      const supabase = getSupabaseClient();
      const activity: any[] = [];

      // Get recent orders
      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, status, total, users(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent users
      const { data: recentUsers, error: usersError } = await supabase
        .from('users')
        .select('name, created_at, role')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentOrders) {
        recentOrders.forEach((order: any) => {
          activity.push({
            type: 'order',
            message: `Order placed by ${order.users?.name || 'Unknown'} - $${order.total}`,
            timestamp: order.created_at
          });
        });
      }

      if (recentUsers) {
        recentUsers.forEach((user: any) => {
          activity.push({
            type: 'user',
            message: `New ${user.role} registered: ${user.name}`,
            timestamp: user.created_at
          });
        });
      }

      return activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Get recent activity error:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const supabase = getSupabaseClient();
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return users?.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }) || [];
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  async getAllVendors(): Promise<any[]> {
    try {
      const supabase = getSupabaseClient();
      const { data: vendors, error } = await supabase
        .from('users')
        .select(`
          *,
          vendor_profiles(brand_name, contact_email, bio, is_approved)
        `)
        .eq('role', 'vendor')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return vendors?.map(vendor => {
        const { password_hash, ...vendorWithoutPassword } = vendor;
        return vendorWithoutPassword;
      }) || [];
    } catch (error) {
      console.error('Get all vendors error:', error);
      return [];
    }
  }

  async getAllProductsForAdmin(): Promise<any[]> {
    try {
      const supabase = getSupabaseClient();
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:users!vendor_id(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return products || [];
    } catch (error) {
      console.error('Get all products for admin error:', error);
      return [];
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      throw new Error('Failed to delete user');
    }
  }

  async rateOrder(userId: string, orderId: string, rating: number, comment?: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      
      // Get the order to find the product IDs
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('items')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      // Insert ratings for each product in the order
      if (order.items && Array.isArray(order.items)) {
        const ratings = order.items.map((item: any) => ({
          user_id: userId,
          product_id: item.product_id || item.product?.id,
          rating,
          comment: comment || null
        }));

        const { error: ratingError } = await supabase
          .from('ratings')
          .upsert(ratings, { 
            onConflict: 'user_id,product_id',
            ignoreDuplicates: false 
          });

        if (ratingError) {
          throw new Error(ratingError.message);
        }
      }
    } catch (error) {
      console.error('Rate order error:', error);
      throw new Error('Failed to submit rating');
    }
  }

  async getProductRating(productId: string): Promise<{ average_rating: number; review_count: number }> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('product_id', productId);

      if (error) {
        throw new Error(error.message);
      }

      if (!ratings || ratings.length === 0) {
        return { average_rating: 0, review_count: 0 };
      }

      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      const averageRating = totalRating / ratings.length;

      return {
        average_rating: parseFloat(averageRating.toFixed(1)),
        review_count: ratings.length
      };
    } catch (error) {
      console.error('Get product rating error:', error);
      return { average_rating: 0, review_count: 0 };
    }
  }

  async getAllSettings(): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .order('key');

      if (error) {
        throw new Error(error.message);
      }

      // Convert array to object for easier access
      const settingsObj = settings?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {}) || {};

      return settingsObj;
    } catch (error) {
      console.error('Get all settings error:', error);
      return {};
    }
  }

  async updateSettings(settings: any): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      
      // Convert object to array of key-value pairs for upsert
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value)
      }));

      for (const setting of settingsArray) {
        const { error } = await supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' });

        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Update settings error:', error);
      throw new Error('Failed to update settings');
    }
  }
}

export const storage = new SupabaseStorage();