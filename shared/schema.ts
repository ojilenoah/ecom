import { pgTable, text, serial, integer, boolean, decimal, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role").$type<'user' | 'vendor'>().default('user'),
  name: text("name"),
  avatar_url: text("avatar_url"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const vendor_profiles = pgTable("vendor_profiles", {
  user_id: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  brand_name: text("brand_name").notNull(),
  business_name: text("business_name"),
  business_type: text("business_type"),
  business_address: text("business_address"),
  phone_number: text("phone_number"),
  logo_url: text("logo_url"),
  contact_email: text("contact_email"),
  bio: text("bio"),
  is_approved: boolean("is_approved").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendor_id: uuid("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image_url: text("image_url"),
  category: text("category"),
  stock: integer("stock").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const cart = pgTable("cart", {
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  items: jsonb("items").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").$type<'pending' | 'paid' | 'fulfilled' | 'cancelled'>().default('pending'),
  vendor_id: uuid("vendor_id").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertVendorProfileSchema = createInsertSchema(vendor_profiles).omit({
  created_at: true,
  updated_at: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCartSchema = createInsertSchema(cart).omit({
  created_at: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  created_at: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  updated_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type VendorProfile = typeof vendor_profiles.$inferSelect;
export type InsertVendorProfile = z.infer<typeof insertVendorProfileSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cart.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
