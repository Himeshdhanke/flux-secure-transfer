const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Document = require('../models/Document');
const Share = require('../models/Share');
const ViewSession = require('../models/ViewSession');
const AuditLog = require('../models/AuditLog');

async function cleanDatabase() {
  try {
    console.log('[DATABASE] Connecting to MongoDB to wipe all data...');
    await connectDB();

    const [usersResult, docsResult, sharesResult, sessionsResult, auditResult] = await Promise.all([
      User.deleteMany({}),
      Document.deleteMany({}),
      Share.deleteMany({}),
      ViewSession.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[DATABASE] Clean Completed Successfully:');
    console.log(`  - Users deleted:        ${usersResult.deletedCount}`);
    console.log(`  - Documents deleted:    ${docsResult.deletedCount}`);
    console.log(`  - Shares deleted:       ${sharesResult.deletedCount}`);
    console.log(`  - ViewSessions deleted: ${sessionsResult.deletedCount}`);
    console.log(`  - AuditLogs deleted:    ${auditResult.deletedCount}`);
    console.log('[DATABASE] All collections are now 100% clean and fresh.');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[DATABASE ERROR] Failed to clean database:', err.message);
    process.exit(1);
  }
}

cleanDatabase();
