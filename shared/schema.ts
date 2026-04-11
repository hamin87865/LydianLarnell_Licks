import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type OrderStatus = "pending" | "paid" | "failed" | "canceled" | "cancelled" | "expired" | "confirmed";
export type SettlementStatus = "pending" | "paid" | "completed";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("basic"),
  upgradeRequestStatus: text("upgrade_request_status").notNull().default("none"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  email: text("email"),
  instagram: text("instagram"),
  layout: text("layout").default("horizontal"),
  language: text("language").default("ko"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  lastNicknameChange: bigint("last_nickname_change", { mode: "number" }),
});

export const contents = pgTable("contents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  thumbnail: text("thumbnail").notNull(),
  videoUrl: text("video_url"),
  videoFile: text("video_file"),
  pdfFile: text("pdf_file"),
  pdfFileName: text("pdf_file_name"),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  pdfPrice: numeric("pdf_price", { precision: 12, scale: 2 }).notNull().default("0"),
  isSanctioned: boolean("is_sanctioned").notNull().default(false),
  sanctionReason: text("sanction_reason"),
  sanctionedAt: timestamp("sanctioned_at", { withTimezone: true }),
});

export const musicianApplications = pgTable("musician_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nickname: text("nickname").notNull(),
  category: text("category").notNull(),
  email: text("email").notNull(),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountHolder: text("account_holder"),
  videoFileName: text("video_file_name").notNull(),
  videoSize: bigint("video_size", { mode: "number" }),
  videoPath: text("video_path"),
  signedContractFileName: text("signed_contract_file_name"),
  signedContractSize: bigint("signed_contract_size", { mode: "number" }),
  signedContractPath: text("signed_contract_path"),
  contractChecked: boolean("contract_checked").notNull().default(false),
  rejectedReason: text("rejected_reason"),
  adminMemo: text("admin_memo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetId: uuid("target_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  notify: boolean("notify").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentOrders = pgTable("payment_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: text("order_id").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: uuid("content_id").notNull().references(() => contents.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("KRW"),
  orderName: text("order_name").notNull(),
  paymentKey: text("payment_key").unique(),
  status: text("status").$type<SettlementStatus>().notNull().default("pending"),
  provider: text("provider").notNull().default("toss"),
  rawPayload: jsonb("raw_payload"),
  rawPreparePayload: jsonb("raw_prepare_payload"),
  rawConfirmPayload: jsonb("raw_confirm_payload"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  expiredAt: timestamp("expired_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    contentId: uuid("content_id").notNull().references(() => contents.id, { onDelete: "cascade" }),
    paymentOrderId: uuid("payment_order_id").references(() => paymentOrders.id, { onDelete: "set null" }),
    status: text("status").notNull().default("active"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userContentUnique: uniqueIndex("purchases_user_content_unique_idx").on(table.userId, table.contentId),
  }),
);

export const monthlySettlementStatus = pgTable("monthly_settlement_status", {
  id: uuid("id").defaultRandom().primaryKey(),
  musicianUserId: uuid("musician_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paidByAdminId: uuid("paid_by_admin_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const monthlySettlementSnapshots = pgTable("monthly_settlement_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  musicianUserId: uuid("musician_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalAmount: integer("total_amount").notNull().default(0),
  payoutAmount: integer("payout_amount").notNull().default(0),
  platformRevenue: integer("platform_revenue").notNull().default(0),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paidByAdminId: uuid("paid_by_admin_id").references(() => users.id, { onDelete: "set null" }),
  snapshot: jsonb("snapshot").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSignupSchema = createInsertSchema(users, {
  email: (schema) => schema.email().trim().toLowerCase(),
  passwordHash: z.string().min(8),
  name: z.string().min(1).max(100),
}).pick({
  email: true,
  passwordHash: true,
  name: true,
});

export type InsertSignup = z.infer<typeof insertSignupSchema>;
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Content = typeof contents.$inferSelect;
export type MusicianApplication = typeof musicianApplications.$inferSelect;
export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
