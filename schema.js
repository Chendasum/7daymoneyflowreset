const { pgTable, serial, text, integer, bigint, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phoneNumber: text('phone_number'),
  email: text('email'),
  joinedAt: timestamp('joined_at').defaultNow(),
  isPaid: boolean('is_paid').default(false),
  paymentDate: timestamp('payment_date'),
  transactionId: text('transaction_id'),
  isVip: boolean('is_vip').default(false),
  tier: text('tier').default('free'), // 'free', 'essential', 'premium', 'vip'
  tierPrice: integer('tier_price').default(0), // 0, 47, 97, 197
  lastActive: timestamp('last_active').defaultNow(),
  timezone: text('timezone').default('Asia/Phnom_Penh'),
  
  // Testimonial and upsell tracking
  testimonials: jsonb('testimonials'), // Array of testimonial objects
  testimonialRequests: jsonb('testimonial_requests'), // Array of request objects
  upsellAttempts: jsonb('upsell_attempts'), // Array of upsell attempt objects
  conversionHistory: jsonb('conversion_history'), // Array of tier changes
});

const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull().unique(),
  currentDay: integer('current_day').default(0),
  readyForDay1: boolean('ready_for_day_1').default(false),
  
  // Day completion tracking
  day0Completed: boolean('day_0_completed').default(false),
  day1Completed: boolean('day_1_completed').default(false),
  day2Completed: boolean('day_2_completed').default(false),
  day3Completed: boolean('day_3_completed').default(false),
  day4Completed: boolean('day_4_completed').default(false),
  day5Completed: boolean('day_5_completed').default(false),
  day6Completed: boolean('day_6_completed').default(false),
  day7Completed: boolean('day_7_completed').default(false),
  
  // Completion timestamps
  day0CompletedAt: timestamp('day_0_completed_at'),
  day1CompletedAt: timestamp('day_1_completed_at'),
  day2CompletedAt: timestamp('day_2_completed_at'),
  day3CompletedAt: timestamp('day_3_completed_at'),
  day4CompletedAt: timestamp('day_4_completed_at'),
  day5CompletedAt: timestamp('day_5_completed_at'),
  day6CompletedAt: timestamp('day_6_completed_at'),
  day7CompletedAt: timestamp('day_7_completed_at'),
  
  // Program completion
  programCompleted: boolean('program_completed').default(false),
  programCompletedAt: timestamp('program_completed_at'),
  
  // User responses/data
  responses: jsonb('responses'),
  
  // Photo/Upload tracking
  day1PhotoUploaded: boolean('day_1_photo_uploaded').default(false),
  day2PhotoUploaded: boolean('day_2_photo_uploaded').default(false),
  day3PhotoUploaded: boolean('day_3_photo_uploaded').default(false),
  day4PhotoUploaded: boolean('day_4_photo_uploaded').default(false),
  day5PhotoUploaded: boolean('day_5_photo_uploaded').default(false),
  day6PhotoUploaded: boolean('day_6_photo_uploaded').default(false),
  day7PhotoUploaded: boolean('day_7_photo_uploaded').default(false),
  
  // Upload timestamps
  day1PhotoUploadedAt: timestamp('day_1_photo_uploaded_at'),
  day2PhotoUploadedAt: timestamp('day_2_photo_uploaded_at'),
  day3PhotoUploadedAt: timestamp('day_3_photo_uploaded_at'),
  day4PhotoUploadedAt: timestamp('day_4_photo_uploaded_at'),
  day5PhotoUploadedAt: timestamp('day_5_photo_uploaded_at'),
  day6PhotoUploadedAt: timestamp('day_6_photo_uploaded_at'),
  day7PhotoUploadedAt: timestamp('day_7_photo_uploaded_at'),
  
  // Upload metadata
  uploadData: jsonb('upload_data'), // Store file info, captions, etc.
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

module.exports = { users, progress };