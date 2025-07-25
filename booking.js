/**
 * VIP Booking System Commands
 * This module handles the 1-on-1 session booking process for VIP tier users.
 * It provides various session types and collects necessary information for booking.
 */

const User = require("../models/User"); // User model for retrieving user data
const AccessControl = require("../services/access-control"); // Service for checking user access rights
const { sendLongMessage } = require("../utils/message-splitter"); // Utility to split long messages

const accessControl = new AccessControl(); // Instantiate AccessControl service

// Define a consistent message chunk size for splitting messages
const MESSAGE_CHUNK_SIZE = 800;

/**
 * Displays the available VIP 1-on-1 session types and general booking information.
 * Checks if the user has access to the booking system before displaying the options.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showBookingSlots(msg, bot) {
  // Check if the user has access to the booking system
  const access = await accessControl.checkAccess(msg.from.id, "booking_system");

  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message); // Send access denied message
    return;
  }

  const bookingMessage = `👑 ការកក់វគ្គ ១-ទល់-១ សម្រាប់ VIP

🎯 វគ្គ Capital Clarity ដែលមាន:
• ការវាយតម្លៃយុទ្ធសាស្ត្រមូលធន (៩០ នាទី) - $197
• ការត្រួតពិនិត្យរចនាសម្ព័ន្ធហិរញ្ញវត្ថុអាជីវកម្ម (៦០ នាទី) - $197
• ការវាយតម្លៃការត្រៀមខ្លួនសម្រាប់ការវិនិយោគ (៦០ នាទី) - $197
• វគ្គយុទ្ធសាស្ត្រមូលធនតាមតម្រូវការ (៩០ នាទី) - $197

📅 ពេលវេលាដែលអាចកក់បាន:
• ថ្ងៃច័ន្ទ - ថ្ងៃសុក្រ: ម៉ោង ៩:០០ ព្រឹក - ៥:០០ ល្ងាច (ម៉ោងកម្ពុជា)
• ថ្ងៃសៅរ៍: ម៉ោង ៩:០០ ព្រឹក - ១២:០០ ថ្ងៃត្រង់ (ម៉ោងកម្ពុជា)
• ថ្ងៃអាទិត្យ: តាមការស្នើសុំពិសេសតែប៉ុណ្ណោះ

💰 ក្របខ័ណ្ឌវគ្គ Capital Clarity:
១. Opening Frame - កំណត់ទំនុកចិត្ត និងបរិបទយុទ្ធសាស្ត្រ
២. Capital X-Ray - ពិនិត្យរចនាសម្ព័ន្ធមូលនិធិ/កិច្ចព្រមព្រៀង និងលំហូរ
៣. Trust Mapping - កំណត់ការបែកបាក់ទំនាក់ទំនង
៤. System Readiness Score - វាយតម្លៃសមត្ថភាពដាក់ពង្រាយ
៥. Clarity Prescription - ផែនទីផ្លូវអភិវឌ្ឍន៍យុទ្ធសាស្ត្រ

🎯 ល្អឥតខ្ចោះសម្រាប់:
• ស្ថាបនិកដែលគ្រប់គ្រងមូលធនឯកជន ($100K+ ក្នុងមួយឆ្នាំ)
• អ្នកប្រតិបត្តិដែលមានរចនាសម្ព័ន្ធមូលនិធិ
• ម្ចាស់អាជីវកម្មដែលគ្រោងមូលនិធិសម្រាប់ការរីកចម្រើន
• វិនិយោគិនដែលត្រូវការការដាក់ពង្រាយមានរចនាសម្ព័ន្ធ
• សហគ្រិនដែលស្វែងរកការបង្កើនប្រសិទ្ធភាពមូលធន

📞 របៀបកក់:
១. ជ្រើសរើសប្រភេទវគ្គដែលអ្នកពេញចិត្ត
២. ជ្រើសរើសពេលវេលាដែលអាចកក់បាន
៣. បង់ប្រាក់ $197
៤. ទទួលបានការអញ្ជើញតាមប្រតិទិន និងសម្ភារៈត្រៀមរៀបចំ

🔥 វគ្គពេញនិយម:
• ការវាយតម្លៃយុទ្ធសាស្ត្រមូលធន - វគ្គដ៏ទូលំទូលាយបំផុត
• ការត្រួតពិនិត្យរចនាសម្ព័ន្ធហិរញ្ញវត្ថុអាជីវកម្ម - សម្រាប់ម្ចាស់អាជីវកម្ម
• ការវាយតម្លៃការត្រៀមខ្លួនសម្រាប់ការវិនិយោគ - សម្រាប់វិនិយោគិន

ពាក្យបញ្ជា:
• /book_capital_clarity - ការវាយតម្លៃយុទ្ធសាស្ត្រមូលធន
• /book_business_review - ការត្រួតពិនិត្យរចនាសម្ព័ន្ធហិរញ្ញវត្ថុអាជីវកម្ម
• /book_investment_evaluation - ការវាយតម្លៃការត្រៀមខ្លួនសម្រាប់ការវិនិយោគ
• /book_custom_session - វគ្គយុទ្ធសាស្ត្រមូលធនតាមតម្រូវការ

📧 ទំនាក់ទំនងផ្ទាល់:
សម្រាប់ការកក់ភ្លាមៗ: @Chendasum
យុទ្ធសាស្ត្រមូលធនកម្រិតខ្ពស់: ការប្រឹក្សាឯកជនមាន`;

  await sendLongMessage(
    bot,
    msg.chat.id,
    bookingMessage,
    {},
    MESSAGE_CHUNK_SIZE,
  );
}

/**
 * Handles the booking process for the Capital Clarity Session.
 * Collects specific user information required for this session.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function bookCapitalClarity(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, "booking_system");

  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const user = access.user; // Get user data from access check result
  const bookingMessage = `🏛️ ការកក់វគ្គ Capital Clarity

ព័ត៌មានលម្អិតវគ្គ:
• រយៈពេល: ៩០ នាទី
• ការវិនិយោគ: $197
• គោលដៅ: ការវិនិច្ឆ័យ និងការបង្កើនប្រសិទ្ធភាពប្រព័ន្ធមូលធនពេញលេញ
• លទ្ធផល: ផែនទីផ្លូវអភិវឌ្ឍន៍យុទ្ធសាស្ត្រមូលធន

អ្វីដែលអ្នកនឹងទទួលបាន:
✅ ការវិភាគលំហូរ និងរចនាសម្ព័ន្ធមូលធន
✅ ការកំណត់ផែនទីស្ថាបត្យកម្មទំនុកចិត្ត
✅ ការវាយតម្លៃការត្រៀមខ្លួនរបស់ប្រព័ន្ធ
✅ Clarity Prescription ជាមួយនឹងការណែនាំជាក់លាក់
✅ ការគាំទ្រការអនុវត្តរយៈពេល ៣០ ថ្ងៃ
✅ ផែនទីផ្លូវអភិវឌ្ឍន៍យុទ្ធសាស្ត្រ

ព័ត៌មានរបស់អ្នក:
• ឈ្មោះ: ${user.firstName} ${user.lastName || ""}
• សមាជិក VIP តាំងពី: ${user.paymentDate?.toLocaleDateString() || "ថ្មីៗនេះ"}
• Telegram: @${user.username || "N/A"}

ក្របខ័ណ្ឌ Capital Clarity:
១. Opening Frame (១០ នាទី) - កំណត់ទំនុកចិត្ត និងបរិបទយុទ្ធសាស្ត្រ
២. Capital X-Ray (២៥ នាទី) - ពិនិត្យរចនាសម្ព័ន្ធមូលនិធិ/កិច្ចព្រមព្រៀង និងលំហូរ
៣. Trust Mapping (២០ នាទី) - កំណត់ការបែកបាក់ទំនាក់ទំនង
៤. System Readiness Score (២០ នាទី) - វាយតម្លៃសមត្ថភាពដាក់ពង្រាយ
៥. Clarity Prescription (១៥ នាទី) - ផែនទីផ្លូវអភិវឌ្ឍន៍យុទ្ធសាស្ត្រ

📞 ដើម្បីបញ្ចប់ការកក់:
សូមផ្ញើព័ត៌មានដូចខាងក្រោម:

CAPITAL CLARITY BOOKING
១. តួនាទី: [ស្ថាបនិក/អ្នកប្រតិបត្តិ/វិនិយោគិន]
២. ក្រុមហ៊ុន: [ឈ្មោះ និងជួរចំណូលប្រចាំឆ្នាំ]
៣. ស្ថានភាពមូលធន: [ការពិពណ៌នាសង្ខេបអំពីការរៀបចំបច្ចុប្បន្ន]
៤. បញ្ហាប្រឈមចម្បង: [អ្វីដែលអ្នកត្រូវការជំនួយ]
៥. កាលកំណត់: [គោលដៅវិនិយោគ និងកាលកំណត់របស់អ្នក]
៦. ថ្ងៃ និងពេលវេលាដែលពេញចិត្ត: [៣ ជម្រើស - ឧទាហរណ៍: "ថ្ងៃច័ន្ទ ម៉ោង ២ រសៀល, ថ្ងៃអង្គារ ម៉ោង ១០ ព្រឹក, ថ្ងៃពុធ ម៉ោង ៣ រសៀល"]
៧. ទំនាក់ទំនង: [អ៊ីមែល និងលេខទូរស័ព្ទ]

ផ្ញើព័ត៌មាននេះជាសារ ហើយអ្នកនឹងទទួលបានការបញ្ជាក់ក្នុងរយៈពេល ២៤ ម៉ោង!

⚠️ សំខាន់: នេះគឺជាយុទ្ធសាស្ត្រមូលធនកម្រិតខ្ពស់សម្រាប់ម្ចាស់អាជីវកម្មធ្ងន់ធ្ងរដែលគ្រប់គ្រងមូលធនសំខាន់ៗ។

🚀 ត្រៀមខ្លួនដើម្បីផ្លាស់ប្តូរយុទ្ធសាស្ត្រមូលធនរបស់អ្នកហើយឬនៅ?`;

  await sendLongMessage(
    bot,
    msg.chat.id,
    bookingMessage,
    {},
    MESSAGE_CHUNK_SIZE,
  );
}

/**
 * Handles the booking process for the Business Financial Structure Review Session.
 * Collects specific user information relevant to business financial review.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function bookBusinessReview(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, "booking_system");

  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const user = access.user;
  const bookingMessage = `🏢 ការកក់វគ្គត្រួតពិនិត្យរចនាសម្ព័ន្ធហិរញ្ញវត្ថុអាជីវកម្ម

ព័ត៌មានលម្អិតវគ្គ:
• រយៈពេល: ៦០ នាទី
• ការវិនិយោគ: $197
• គោលដៅ: ការបង្កើនប្រសិទ្ធភាពរចនាសម្ព័ន្ធហិរញ្ញវត្ថុអាជីវកម្ម
• លទ្ធផល: ប្រព័ន្ធហិរញ្ញវត្ថុអាជីវកម្មដែលមានប្រសិទ្ធភាព

អ្វីដែលអ្នកនឹងទទួលបាន:
✅ ការវិភាគលំហូរសាច់ប្រាក់អាជីវកម្ម
✅ ការបង្កើនប្រសិទ្ធភាពរចនាសម្ព័ន្ធចំណាយ
✅ ការវាយតម្លៃប្រភពចំណូល
✅ ការណែនាំប្រព័ន្ធហិរញ្ញវត្ថុ
✅ កាលកំណត់អនុវត្ត
✅ ការវាយតម្លៃការត្រៀមខ្លួនមូលធន

ព័ត៌មានរបស់អ្នក:
• ឈ្មោះ: ${user.firstName} ${user.lastName || ""}
• សមាជិក VIP តាំងពី: ${user.paymentDate?.toLocaleDateString() || "ថ្មីៗនេះ"}
• Telegram: @${user.username || "N/A"}

📞 ដើម្បីបញ្ចប់ការកក់:
សូមផ្ញើព័ត៌មានដូចខាងក្រោម:

BUSINESS REVIEW BOOKING
១. ប្រភេទអាជីវកម្ម: [ឧស្សាហកម្ម និងម៉ូដែលអាជីវកម្ម]
២. ជួរចំណូល: [ចំណូលប្រចាំខែ/ប្រចាំឆ្នាំ]
៣. ទំហំក្រុម: [ចំនួនបុគ្គលិក]
៤. បញ្ហាប្រឈមចម្បង: [បញ្ហាហិរញ្ញវត្ថុបច្ចុប្បន្ន]
៥. គោលដៅ: [អ្វីដែលអ្នកចង់សម្រេច]
៦. ថ្ងៃ និងពេលវេលាដែលពេញចិត្ត: [៣ ជម្រើស]
៧. ទំនាក់ទំនង: [អ៊ីមែល និងលេខទូរស័ព្ទ]

ផ្ញើព័ត៌មាននេះជាសារ ហើយអ្នកនឹងទទួលបានការបញ្ជាក់ក្នុងរយៈពេល ២៤ ម៉ោង!

📈 ត្រៀមខ្លួនដើម្បីបង្កើនប្រសិទ្ធភាពរចនាសម្ព័ន្ធហិរញ្ញវត្ថុអាជីវកម្មរបស់អ្នកហើយឬនៅ?`;

  await sendLongMessage(
    bot,
    msg.chat.id,
    bookingMessage,
    {},
    MESSAGE_CHUNK_SIZE,
  );
}

/**
 * Handles the booking process for the Investment Readiness Evaluation Session.
 * Collects specific user information relevant to investment and capital deployment.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function bookInvestmentEvaluation(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, "booking_system");

  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const user = access.user;
  const bookingMessage = `💎 ការកក់វគ្គវាយតម្លៃការត្រៀមខ្លួនសម្រាប់ការវិនិយោគ

ព័ត៌មានលម្អិតវគ្គ:
• រយៈពេល: ៦០ នាទី
• ការវិនិយោគ: $197
• គោលដៅ: ការត្រៀមខ្លួនសម្រាប់ការវិនិយោគ និងការដាក់ពង្រាយមូលធន
• លទ្ធផល: ផែនទីផ្លូវយុទ្ធសាស្ត្រវិនិយោគ

អ្វីដែលអ្នកនឹងទទួលបាន:
✅ ការវាយតម្លៃការត្រៀមខ្លួនសម្រាប់ការវិនិយោគ
✅ ការវាយតម្លៃកម្រិតហានិភ័យ
✅ ឱកាសដាក់ពង្រាយមូលធន
✅ ការណែនាំផលប័ត្រ
✅ ការវាយតម្លៃការត្រៀមខ្លួន LP (Limited Partner)
✅ ការណែនាំជំហានបន្ទាប់

ព័ត៌មានរបស់អ្នក:
• ឈ្មោះ: ${user.firstName} ${user.lastName || ""}
• សមាជិក VIP តាំងពី: ${user.paymentDate?.toLocaleDateString() || "ថ្មីៗនេះ"}
• Telegram: @${user.username || "N/A"}

📞 ដើម្បីបញ្ចប់ការកក់:
សូមផ្ញើព័ត៌មានដូចខាងក្រោម:

INVESTMENT EVALUATION BOOKING
១. បទពិសោធន៍វិនិយោគ: [កម្រិតបច្ចុប្បន្ន និងប្រវត្តិ]
២. មូលធនដែលមាន: [ជួរទឹកប្រាក់វិនិយោគ]
៣. កម្រិតហានិភ័យ: [អភិរក្ស/មធ្យម/ឈ្លានពាន]
៤. គោលដៅវិនិយោគ: [អ្វីដែលអ្នកចង់សម្រេច]
៥. កាលកំណត់: [កាលកំណត់ និងគោលបំណងវិនិយោគ]
៦. ថ្ងៃ និងពេលវេលាដែលពេញចិត្ត: [៣ ជម្រើស]
៧. ទំនាក់ទំនង: [អ៊ីមែល និងលេខទូរស័ព្ទ]

ផ្ញើព័ត៌មាននេះជាសារ ហើយអ្នកនឹងទទួលបានការបញ្ជាក់ក្នុងរយៈពេល ២៤ ម៉ោង!

🚀 ត្រៀមខ្លួនដើម្បីចាប់ផ្តើមដំណើរវិនិយោគយុទ្ធសាស្ត្ររបស់អ្នកហើយឬនៅ?`;

  await sendLongMessage(
    bot,
    msg.chat.id,
    bookingMessage,
    {},
    MESSAGE_CHUNK_SIZE,
  );
}

/**
 * Handles the booking process for a Custom Capital Strategy Session.
 * Collects specific user requirements for a personalized session.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function bookCustomSession(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, "booking_system");

  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const user = access.user;
  const bookingMessage = `🎨 ការកក់វគ្គយុទ្ធសាស្ត្រមូលធនតាមតម្រូវការ

ព័ត៌មានលម្អិតវគ្គ:
• រយៈពេល: ៩០ នាទី
• ការវិនិយោគ: $197
• គោលដៅ: តាមតម្រូវការជាក់លាក់នៃមូលធនរបស់អ្នក
• លទ្ធផល: យុទ្ធសាស្ត្រមូលធនផ្ទាល់ខ្លួន

អ្វីដែលអ្នកនឹងទទួលបាន:
✅ របៀបវារៈវគ្គតាមតម្រូវការ
✅ ការដោះស្រាយបញ្ហាមូលធនផ្តោត
✅ ការណែនាំយុទ្ធសាស្ត្រជាក់លាក់
✅ ជំហានអនុវត្តដែលអាចធ្វើបាន
✅ ការគាំទ្រតាមដាន
✅ ការណែនាំបណ្តាញ (ប្រសិនបើពាក់ព័ន្ធ)

ព័ត៌មានរបស់អ្នក:
• ឈ្មោះ: ${user.firstName} ${user.lastName || ""}
• សមាជិក VIP តាំងពី: ${user.paymentDate?.toLocaleDateString() || "ថ្មីៗនេះ"}
• Telegram: @${user.username || "N/A"}

📞 ដើម្បីបញ្ចប់ការកក់:
សូមផ្ញើព័ត៌មានដូចខាងក្រោម:

CUSTOM SESSION BOOKING
១. គោលដៅជាក់លាក់: [ប្រធានបទមូលធនអ្វីដែលអ្នកចង់ផ្តោតលើ]
២. ស្ថានភាពបច្ចុប្បន្ន: [ស្ថានភាពមូលធន/អាជីវកម្មបច្ចុប្បន្នរបស់អ្នក]
៣. បញ្ហាប្រឈមចម្បង: [បញ្ហាជាក់លាក់ដែលអ្នកកំពុងជួបប្រទះ]
៤. លទ្ធផលដែលរំពឹងទុក: [អ្វីដែលអ្នកចង់សម្រេច]
៥. កាលកំណត់: [ពេលណាអ្នកត្រូវការលទ្ធផល]
៦. ថ្ងៃ និងពេលវេលាដែលពេញចិត្ត: [៣ ជម្រើស]
៧. ទំនាក់ទំនង: [អ៊ីមែល និងលេខទូរស័ព្ទ]

ផ្ញើព័ត៌មាននេះជាសារ ហើយអ្នកនឹងទទួលបានការបញ្ជាក់ក្នុងរយៈពេល ២៤ ម៉ោង!

🎯 ត្រៀមខ្លួនសម្រាប់វគ្គយុទ្ធសាស្ត្រមូលធនផ្ទាល់ខ្លួនហើយឬនៅ?`;

  await sendLongMessage(
    bot,
    msg.chat.id,
    bookingMessage,
    {},
    MESSAGE_CHUNK_SIZE,
  );
}

// Export all functions that need to be accessible from other modules (e.g., index.js)
module.exports = {
  showBookingSlots,
  bookCapitalClarity,
  bookBusinessReview,
  bookInvestmentEvaluation,
  bookCustomSession,
};
