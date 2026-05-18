import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "owner",
  "staff",
]);

export const shopStatusEnum = pgEnum("shop_status", [
  "trial",
  "active",
  "suspended",
  "pending_payment",
]);

export const shopCreatedByEnum = pgEnum("shop_created_by", [
  "self",
  "superadmin",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const appointmentSourceEnum = pgEnum("appointment_source", [
  "online",
  "manual",
]);

export const staffPreferenceEnum = pgEnum("staff_preference", [
  "specific",
  "any",
]);

export const userThemeEnum = pgEnum("user_theme", ["dark", "light", "system"]);
export const userLocaleEnum = pgEnum("user_locale", ["es", "en"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("owner"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("verification_tokens_identifier_token").on(
      t.identifier,
      t.token,
    ),
  ],
);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  locale: userLocaleEnum("locale").notNull().default("es"),
  theme: userThemeEnum("theme").notNull().default("dark"),
  emailNewBooking: boolean("email_new_booking").notNull().default(true),
  emailBookingConfirmed: boolean("email_booking_confirmed")
    .notNull()
    .default(true),
  emailTrialReminders: boolean("email_trial_reminders").notNull().default(true),
  emailAppointmentReminder: boolean("email_appointment_reminder")
    .notNull()
    .default(true),
  pushEnabled: boolean("push_enabled").notNull().default(false),
  pushSubscription: jsonb("push_subscription"),
  timezone: text("timezone"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    status: shopStatusEnum("status").notNull().default("trial"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }).notNull(),
    subscriptionId: text("subscription_id"),
    subscriptionStatus: text("subscription_status"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdBy: shopCreatedByEnum("created_by").notNull().default("self"),
    phone: text("phone"),
    whatsappNumber: text("whatsapp_number"),
    description: text("description"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    country: text("country").notNull().default("HN"),
    postalCode: text("postal_code"),
    formattedAddress: text("formatted_address"),
    googlePlaceId: text("google_place_id"),
    lat: decimal("lat", { precision: 10, scale: 7 }),
    lng: decimal("lng", { precision: 10, scale: 7 }),
    timezone: text("timezone").notNull().default("America/Tegucigalpa"),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").notNull().default("#0a0a0a"),
    accentColor: text("accent_color").notNull().default("#c9a227"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    seoKeywords: text("seo_keywords"),
    instagramUrl: text("instagram_url"),
    minNoticeHours: integer("min_notice_hours").notNull().default(2),
    maxDaysAhead: integer("max_days_ahead").notNull().default(30),
    slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30),
    billingExempt: boolean("billing_exempt").notNull().default(false),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),
    profileCompleteness: integer("profile_completeness").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("shops_slug_idx").on(t.slug)],
);

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  priceDisplay: text("price_display"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const shopStaff = pgTable("shop_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  displayName: text("display_name").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  acceptsOnlineBookings: boolean("accepts_online_bookings")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const businessHours = pgTable("business_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  isClosed: boolean("is_closed").notNull().default(false),
});

export const staffBusinessHours = pgTable("staff_business_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffMemberId: uuid("staff_member_id")
    .notNull()
    .references(() => shopStaff.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  isClosed: boolean("is_closed").notNull().default(false),
});

export const availabilityExceptions = pgTable("availability_exceptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  isClosed: boolean("is_closed").notNull().default(true),
  customOpen: text("custom_open"),
  customClose: text("custom_close"),
  note: text("note"),
});

export const staffAvailabilityExceptions = pgTable(
  "staff_availability_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    staffMemberId: uuid("staff_member_id")
      .notNull()
      .references(() => shopStaff.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    isClosed: boolean("is_closed").notNull().default(true),
    customOpen: text("custom_open"),
    customClose: text("custom_close"),
  },
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    staffMemberId: uuid("staff_member_id")
      .notNull()
      .references(() => shopStaff.id),
    staffPreference: staffPreferenceEnum("staff_preference")
      .notNull()
      .default("specific"),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    source: appointmentSourceEnum("source").notNull().default("online"),
    clientName: text("client_name").notNull(),
    clientPhone: text("client_phone").notNull(),
    clientEmail: text("client_email"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    cancellationReason: text("cancellation_reason"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("appointments_shop_staff_start_idx").on(
      t.shopId,
      t.staffMemberId,
      t.startAt,
    ),
  ],
);

export const blockedSlots = pgTable("blocked_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  staffMemberId: uuid("staff_member_id").references(() => shopStaff.id),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  reason: text("reason"),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const subscriptionEvents = pgTable(
  "subscription_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    paypalEventId: text("paypal_event_id").notNull(),
    rawJson: jsonb("raw_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("subscription_events_paypal_idx").on(t.paypalEventId)],
);

export const notificationLogs = pgTable("notification_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id),
  type: text("type").notNull(),
  to: text("to").notNull(),
  subject: text("subject"),
  resendId: text("resend_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const staffInvitations = pgTable("staff_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  targetShopId: uuid("target_shop_id").references(() => shops.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
