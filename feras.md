golden-horse-server@1.0.0 start
> node src/server.js

🔍 Database Configuration Debug:
  - NODE_ENV: production
  - DB_URL present: true
  - DATABASE_URL present: true
  - Raw DATABASE_URL starts with: postgres://post...
  - Cleaned DATABASE_URL present: true
  - Final DATABASE_URL length: 115
  - Final DATABASE_URL starts with: postgres://post...
🔍 Environment: "production" (original: "production")
🔗 Using database URL connection
🔍 Database URL value: Set (hidden for security)
🔍 URL source: DATABASE_URL
🔍 URL Debug Info:
  - URL length: 115
  - URL first 20 chars: postgres://postgres:
  - URL contains ://: true
  - URL starts with =: false
  - URL starts with postgresql: false
  - URL starts with postgres: true
🔍 Parsed URL Info:
  - Protocol: postgres:
  - Host: s4sogs888gswckoosgcwkss0
  - Port: 5432
  - Database: /
🔧 Converting postgres:// to postgresql://
🔗 Final URL protocol: postgresql://
🔒 Using memory-only JWT blacklist
🔍 Database dialect detected: postgres
🔍 Environment: "production" (original: "production")
✅ Environment variables validation passed
🛡️  Rate limiting enabled
📁 Serving static files from: /app/client/dist
🚀 Starting Golden Horse Shipping Server...
🏗️  Initializing database...
🔍 Testing database connection...
⚠️  Redis not available, using memory-only cache
✅ Error logging initialized
⏰ Periodic monitoring tasks started
✅ Monitoring system initialized
✅ Database connection successful
✅ Database query test successful - Current time: Sun Sep 21 2025 12:47:56 GMT+0000 (Coordinated Universal Time)
📋 Skipping automatic database table synchronization (tables already updated)
🔍 التحقق من وجود الحسابات الرئيسية الافتراضية...
📊 الحسابات الرئيسية الموجودة: 1, 2, 3, 4, 5
✅ جميع الحسابات الرئيسية موجودة بالفعل
✅ الحسابات الرئيسية: undefined حساب (0 جديد، 5 موجود)
🔧 التحقق من الحسابات التشغيلية الافتراضية (صندوق/مصرف/ذمم/إيرادات خدمات)...
✅ الحسابات التشغيلية: تمت إضافة 0 (إن وجدت)
✅ Database has 4 users - appears to be initialized
⏰ Backup schedules configured:
   - Daily backup: 2:00 AM
   - Weekly cleanup: Sunday 3:00 AM
✅ Backup Manager initialized successfully
✅ Backup system initialized
WebSocket service initialized
✅ WebSocket service initialized
🚀 Server running on port 5001
🌐 API available at http://localhost:5001/api
🔌 WebSocket available at ws://localhost:5001
🏥 Health check: http://localhost:5001/api/health
📊 Database health: http://localhost:5001/api/health/database
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 36ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 36,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584589765248kfpwd8q8'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 15ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175845917189807cwv352y'
}
[INFO] System metrics {
  metrics: {
    uptime: 300048,
    requests: 2,
    errors: 0,
    errorRate: 0,
    averageResponseTime: 26,
    activeConnections: 0,
    memory: {
      rss: 97632256,
      heapTotal: 31354880,
      heapUsed: 29107624,
      external: 3369761,
      arrayBuffers: 68577
    },
    cpu: { user: 922844, system: 266992 },
    system: {
      platform: 'linux',
      arch: 'x64',
      nodeVersion: 'v18.20.5',
      totalMemory: 8326750208,
      freeMemory: 6907920384,
      loadAverage: [Array],
      uptime: 911461.98
    }
npm warn config production Use `--omit=dev` instead.
npm warn config production Use `--omit=dev` instead.
⚠️  تحذير: تعذر ضمان AccountMapping الافتراضي: column "salesTaxAccount" does not exist
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:49:36.544 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:49:36.544 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:49:36.544 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Notification.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:52:51.908 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:52:51.908 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:52:51.908 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
}
  }
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 15ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459330791i4wx4qhg0'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 10ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459453907tij8ssiv5'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 11ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 11,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459456614pixn7lxqs'
}
[INFO] System metrics {
  metrics: {
    uptime: 600048,
    requests: 5,
    errors: 0,
    errorRate: 0,
    averageResponseTime: 17,
    activeConnections: 0,
    memory: {
      rss: 97411072,
      heapTotal: 31879168,
      heapUsed: 28669504,
      external: 3376766,
      arrayBuffers: 75582
    },
    cpu: { user: 1027049, system: 281608 },
    system: {
      platform: 'linux',
      arch: 'x64',
      nodeVersion: 'v18.20.5',
      totalMemory: 8326750208,
      freeMemory: 6909931520,
      loadAverage: [Array],
      uptime: 911761.98
    }
  }
}
[INFO] Database metrics {
  database: {
    connected: true,
    connectionTime: 2,
    pool: { size: 2, available: 2, using: 0, waiting: 0 }
  }
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:55:30.802 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:55:30.802 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:55:30.802 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:57:33.913 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:57:33.913 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:57:33.913 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:57:36.619 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:57:36.619 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:57:36.619 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:58:06.922 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 7ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584594869193jd12e4en'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 8ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584595188397pj1e4olt'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:58:06.922 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:58:06.922 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:58:38.844 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:58:38.844 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:58:38.844 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 10ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459550345tp282pugh'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:59:10.350 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:59:10.350 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:59:10.350 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:59:40.491 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459580488ng8t3x7jg'
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:59:40.491 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 12:59:40.491 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 17ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 17,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459610488ug0b7aigt'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Notification.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:00:10.500 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:00:10.500 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:00:10.500 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Notification.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:00:45.516 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:00:45.516 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:00:45.516 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
}
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 12ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 12,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584596455092ceq2hgjw'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:01:45.587 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 7ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584597055832f1h00hgj'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 5ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459765477ydscp85ym'
}
[INFO] System metrics {
  metrics: {
    uptime: 900047,
    requests: 13,
    errors: 0,
    errorRate: 0,
    averageResponseTime: 12,
    activeConnections: 0,
    memory: {
      rss: 98205696,
      heapTotal: 32665600,
      heapUsed: 29867472,
      external: 3394537,
      arrayBuffers: 93353
    },
    cpu: { user: 1156299, system: 311630 },
    system: {
      platform: 'linux',
      arch: 'x64',
      nodeVersion: 'v18.20.5',
      totalMemory: 8326750208,
      freeMemory: 6904266752,
      loadAverage: [Array],
      uptime: 912061.98
    }
  }
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:01:45.587 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:01:45.587 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:02:45.480 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:02:45.480 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:02:45.480 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584598254804kc8dhk30'
}
[INFO] GET / - 200 - 17ms {
  method: 'GET',
  url: '/',
  statusCode: 200,
  responseTime: 17,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '175845991168161flmkjij'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758459912178 - 200 - 12ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758459912178',
  statusCode: 200,
  responseTime: 12,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758459912047c47nwaq9k'
}
[INFO] POST /api/auth/login - 200 - 100ms {
  method: 'POST',
  url: '/api/auth/login',
  statusCode: 200,
  responseTime: 100,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758459922246p58hrq0mh'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:03:45.483 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:03:45.483 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:03:45.483 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1325:20 {
  name: 'SequelizeDatabaseError',
  parent: error: column s.totalAmount does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 173,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "si.totalAmount".',
    position: '286',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT\n' +
      '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
      '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
      '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
      '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
      '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
      '      FROM sales_invoices si\n' +
      '      LEFT JOIN shipments s ON true\n' +
      '      WHERE si."isActive" = true',
    parameters: undefined
  },
  original: error: column s.totalAmount does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 173,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "si.totalAmount".',
    position: '286',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT\n' +
      '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
      '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
      '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
[INFO] GET /api/sales/summary - 500 - 11ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 11,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459922540prkyqlqc9'
}
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 22ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 22,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459922545o8f6z5opu'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 10ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459922585dn23w2g68'
}
[INFO] GET /api/settings - 200 - 13ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459922585vaj3an1kx'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/roles - 304 - 15ms {
  method: 'GET',
  url: '/api/admin/roles',
  statusCode: 304,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459922634mei342zb7'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/system-stats - 200 - 13ms {
  method: 'GET',
  url: '/api/admin/system-stats',
  statusCode: 200,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584599226698z6cbayqy'
}
[INFO] GET /api/admin/users - 304 - 20ms {
  method: 'GET',
  url: '/api/admin/users',
  statusCode: 304,
  responseTime: 20,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459922665pdqm13k26'
}
[INFO] GET /api/admin/overview - 200 - 30ms {
  method: 'GET',
  url: '/api/admin/overview',
  statusCode: 200,
  responseTime: 30,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175845992266642r3cteow'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758459922838 - 200 - 8ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758459922838',
  statusCode: 200,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758459922707szheoepec'
}
[INFO] GET /api/settings - 200 - 20ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 20,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175845992270002poldzmr'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758459923002 - 200 - 5ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758459923002',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758459922902kpxf7uk7s'
}
[INFO] GET /assets/index-DbXQBNN4.css - 200 - 2ms {
  method: 'GET',
  url: '/assets/index-DbXQBNN4.css',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758459925231b788tqlbm'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
      '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
      '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
      '      FROM sales_invoices si\n' +
      '      LEFT JOIN shipments s ON true\n' +
      '      WHERE si."isActive" = true',
    parameters: undefined
  },
  sql: 'SELECT\n' +
    '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
    '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
    '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
    '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
    '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
    '      FROM sales_invoices si\n' +
    '      LEFT JOIN shipments s ON true\n' +
    '      WHERE si."isActive" = true',
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Notification.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:22.589 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:22.589 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:22.589 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
}
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1325:20 {
  name: 'SequelizeDatabaseError',
  parent: error: column s.totalAmount does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 173,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "si.totalAmount".',
    position: '286',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT\n' +
      '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
      '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
      '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
      '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
      '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
      '      FROM sales_invoices si\n' +
      '      LEFT JOIN shipments s ON true\n' +
      '      WHERE si."isActive" = true',
    parameters: undefined
  },
  original: error: column s.totalAmount does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 173,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "si.totalAmount".',
    position: '286',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT\n' +
      '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
      '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
      '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
      '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
      '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
[INFO] GET /api/sales/summary - 500 - 11ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 11,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584599316364cq1fsclm'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/customers?limit=10 - 304 - 11ms {
  method: 'GET',
  url: '/api/sales/customers?limit=10',
  statusCode: 304,
  responseTime: 11,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459931649tkfgt50jd'
}
[INFO] GET /sales/invoice-management - 200 - 2ms {
  method: 'GET',
  url: '/sales/invoice-management',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584599367651ffcq5tuj'
}
[INFO] GET /assets/index-DbXQBNN4.css - 304 - 1ms {
  method: 'GET',
  url: '/assets/index-DbXQBNN4.css',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758459936951wwazrrutb'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 200 - 3ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459937164q6ltwko08'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
      '      FROM sales_invoices si\n' +
      '      LEFT JOIN shipments s ON true\n' +
      '      WHERE si."isActive" = true',
    parameters: undefined
  },
  sql: 'SELECT\n' +
    '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
    '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
    '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
    '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
    '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
    '      FROM sales_invoices si\n' +
    '      LEFT JOIN shipments s ON true\n' +
    '      WHERE si."isActive" = true',
  parameters: {}
}
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1325:20 {
  name: 'SequelizeDatabaseError',
  parent: error: column s.totalAmount does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 173,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "si.totalAmount".',
    position: '286',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT\n' +
      '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
      '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
      '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
      '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
      '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
      '      FROM sales_invoices si\n' +
      '      LEFT JOIN shipments s ON true\n' +
      '      WHERE si."isActive" = true',
    parameters: undefined
  },
  original: error: column s.totalAmount does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 173,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "si.totalAmount".',
    position: '286',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT\n' +
      '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
      '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
      '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
      '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
      '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
      '      FROM sales_invoices si\n' +
      '      LEFT JOIN shipments s ON true\n' +
      '      WHERE si."isActive" = true',
    parameters: undefined
  },
  sql: 'SELECT\n' +
    '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
    '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
    '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
    '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
    '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
    '      FROM sales_invoices si\n' +
    '      LEFT JOIN shipments s ON true\n' +
    '      WHERE si."isActive" = true',
  parameters: {}
}
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
[INFO] GET /api/sales/summary - 500 - 25ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 25,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459937329tzi9g9l31'
}
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/settings - 200 - 35ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 35,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584599373359zjmhxsww'
}
[INFO] GET /assets/SearchFilter-C3mbLl48.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/SearchFilter-C3mbLl48.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.196',
  userId: undefined,
  username: undefined,
  requestId: '1758459937375bksf5ho39'
}
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 51ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 51,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584599373345dthkgb59'
}
[INFO] GET /assets/FormField-pzWz9qi8.js - 304 - 5ms {
  method: 'GET',
  url: '/assets/FormField-pzWz9qi8.js',
  statusCode: 304,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.198',
  userId: undefined,
  username: undefined,
  requestId: '1758459937392ushvxb618'
}
[INFO] GET /assets/chevron-right-B-S2z0UR.js - 304 - 2ms {
  method: 'GET',
  url: '/assets/chevron-right-B-S2z0UR.js',
  statusCode: 304,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.195',
  userId: undefined,
  username: undefined,
  requestId: '1758459937400kcn0jdwh0'
}
[INFO] GET /assets/Modal-DCaS_Iw8.js - 304 - 3ms {
  method: 'GET',
  url: '/assets/Modal-DCaS_Iw8.js',
  statusCode: 304,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.135',
  userId: undefined,
  username: undefined,
  requestId: '175845993740197hm5mb63'
}
[INFO] GET /assets/chevrons-right-B6IigW8S.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/chevrons-right-B6IigW8S.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.180',
  userId: undefined,
  username: undefined,
  requestId: '1758459937412ysgdz9ilo'
}
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 71ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 71,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459937351jx8ozwk2k'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 12ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 12,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459937472axftp55rm'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758459937609 - 200 - 2ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758459937609',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758459937501h5xut81wo'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:37.365 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:37.365 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:37.365 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching shipping invoices: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async ShippingInvoice.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async ShippingInvoice.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async ShippingInvoice.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async file:///app/server/src/routes/sales.js:2646:39 {
  name: 'SequelizeDatabaseError',
  parent: error: column ShippingInvoice.customerId does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 199,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "ShippingInvoice.customer_id".',
    position: '140',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT count("ShippingInvoice"."id") AS "count" FROM "shipping_invoices" AS "ShippingInvoice" LEFT OUTER JOIN "customers" AS "customer" ON "ShippingInvoice"."customerId" = "customer"."id" LEFT OUTER JOIN "shipments" AS "shipment" ON "ShippingInvoice"."shipmentId" = "shipment"."id";',
    parameters: undefined
  },
  original: error: column ShippingInvoice.customerId does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 199,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "ShippingInvoice.customer_id".',
    position: '140',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT count("ShippingInvoice"."id") AS "count" FROM "shipping_invoices" AS "ShippingInvoice" LEFT OUTER JOIN "customers" AS "customer" ON "ShippingInvoice"."customerId" = "customer"."id" LEFT OUTER JOIN "shipments" AS "shipment" ON "ShippingInvoice"."shipmentId" = "shipment"."id";',
    parameters: undefined
  },
  sql: 'SELECT count("ShippingInvoice"."id") AS "count" FROM "shipping_invoices" AS "ShippingInvoice" LEFT OUTER JOIN "customers" AS "customer" ON "ShippingInvoice"."customerId" = "customer"."id" LEFT OUTER JOIN "shipments" AS "shipment" ON "ShippingInvoice"."shipmentId" = "shipment"."id";',
  parameters: {}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
📁 Current logo request
[INFO] GET /api/sales/shipping-invoices?page=1&limit=10 - 500 - 10ms {
}
  method: 'GET',
  url: '/api/sales/shipping-invoices?page=1&limit=10',
  statusCode: 500,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459937644qwbhq5uw9'
}
Error fetching invoices: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Invoice.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async file:///app/server/src/routes/sales.js:554:22 {
[INFO] GET /api/sales/invoices?page=1&limit=10 - 500 - 15ms {
  method: 'GET',
  url: '/api/sales/invoices?page=1&limit=10',
  statusCode: 500,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459937644m7e5kc8em'
}
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758459937771 - 200 - 7ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758459937771',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  name: 'SequelizeDatabaseError',
  parent: error: column Invoice.dueDate does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 172,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "Invoice.date".',
    position: '93',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT "Invoice"."id", "Invoice"."invoiceNumber", "Invoice"."customerId", "Invoice"."date", "Invoice"."dueDate", "Invoice"."subtotal", "Invoice"."taxAmount", "Invoice"."total", "Invoice"."paidAmount", "Invoice"."status", "Invoice"."outstandingAmount", "Invoice"."accountId", "Invoice"."currency", "Invoice"."exchangeRate", "Invoice"."createdBy", "Invoice"."notes", "Invoice"."createdAt", "Invoice"."updatedAt", "customer"."id" AS "customer.id", "customer"."code" AS "customer.code", "customer"."name" AS "customer.name", "customer"."type" AS "customer.type" FROM "invoices" AS "Invoice" LEFT OUTER JOIN "customers" AS "customer" ON "Invoice"."customerId" = "customer"."id" ORDER BY "Invoice"."date" DESC LIMIT 10 OFFSET 0;',
    parameters: undefined
  },
  original: error: column Invoice.dueDate does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 172,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "Invoice.date".',
    position: '93',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT "Invoice"."id", "Invoice"."invoiceNumber", "Invoice"."customerId", "Invoice"."date", "Invoice"."dueDate", "Invoice"."subtotal", "Invoice"."taxAmount", "Invoice"."total", "Invoice"."paidAmount", "Invoice"."status", "Invoice"."outstandingAmount", "Invoice"."accountId", "Invoice"."currency", "Invoice"."exchangeRate", "Invoice"."createdBy", "Invoice"."notes", "Invoice"."createdAt", "Invoice"."updatedAt", "customer"."id" AS "customer.id", "customer"."code" AS "customer.code", "customer"."name" AS "customer.name", "customer"."type" AS "customer.type" FROM "invoices" AS "Invoice" LEFT OUTER JOIN "customers" AS "customer" ON "Invoice"."customerId" = "customer"."id" ORDER BY "Invoice"."date" DESC LIMIT 10 OFFSET 0;',
    parameters: undefined
  },
  sql: 'SELECT "Invoice"."id", "Invoice"."invoiceNumber", "Invoice"."customerId", "Invoice"."date", "Invoice"."dueDate", "Invoice"."subtotal", "Invoice"."taxAmount", "Invoice"."total", "Invoice"."paidAmount", "Invoice"."status", "Invoice"."outstandingAmount", "Invoice"."accountId", "Invoice"."currency", "Invoice"."exchangeRate", "Invoice"."createdBy", "Invoice"."notes", "Invoice"."createdAt", "Invoice"."updatedAt", "customer"."id" AS "customer.id", "customer"."code" AS "customer.code", "customer"."name" AS "customer.name", "customer"."type" AS "customer.type" FROM "invoices" AS "Invoice" LEFT OUTER JOIN "customers" AS "customer" ON "Invoice"."customerId" = "customer"."id" ORDER BY "Invoice"."date" DESC LIMIT 10 OFFSET 0;',
  parameters: {}
}
  username: undefined,
  requestId: '1758459937657xnvhl8gin'
}
[INFO] GET /api/sales/customers?page=1&limit=100 - 304 - 18ms {
  method: 'GET',
  url: '/api/sales/customers?page=1&limit=100',
  statusCode: 304,
  responseTime: 18,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459937647pvifxso1a'
}
[INFO] GET /sales/reports - 200 - 2ms {
  method: 'GET',
  url: '/sales/reports',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758459943253exfrmwku1'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 304 - 3ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 304,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584599436221rkp8j8c1'
}
[INFO] GET /assets/SalesReports-BoCoMw7F.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/SalesReports-BoCoMw7F.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758459943754h7xnecpyr'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 5ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459943773iohu70prk'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
[INFO] GET /api/sales/summary - 500 - 8ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584599437837x9fj4646'
}
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1325:20 {
  name: 'SequelizeDatabaseError',
  parent: error: column s.totalAmount does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 173,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "si.totalAmount".',
    position: '286',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT\n' +
      '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
      '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
      '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
      '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
      '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
      '      FROM sales_invoices si\n' +
      '      LEFT JOIN shipments s ON true\n' +
      '      WHERE si."isActive" = true',
    parameters: undefined
  },
  original: error: column s.totalAmount does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 173,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "si.totalAmount".',
    position: '286',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3723',
    routine: 'errorMissingColumn',
    sql: 'SELECT\n' +
      '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
      '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
      '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
      '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
      '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
      '      FROM sales_invoices si\n' +
      '      LEFT JOIN shipments s ON true\n' +
      '      WHERE si."isActive" = true',
    parameters: undefined
  },
  sql: 'SELECT\n' +
    '        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,\n' +
    '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
    '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
    '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
    '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
    '      FROM sales_invoices si\n' +
    '      LEFT JOIN shipments s ON true\n' +
    '      WHERE si."isActive" = true',
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:43.798 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:43.798 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 17ms {
  method: 'GET',
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:05:43.798 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 17,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459943785hbst6koyh'
}
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 30ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 30,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584599437863a7snzj4v'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 5ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459943871lurxg1eol'
}
📁 Current logo request
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ Current logo found: logo-1758303047268-17121842.PNG
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
[INFO] GET /api/settings/logo?t=1758459944035 - 200 - 5ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758459944035',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758459943912a0kk7rkhu'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-21&reportType=detailed - 500 - 9ms {
  method: 'GET',
  url: '/api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-21&reportType=detailed',
  statusCode: 500,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459943913fpwrrx5gy'
}
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-21&reportType=product - 500 - 5ms {
Error generating sales reports: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:3499:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_reports(unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 236,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_reports($1, $2, $3) as report',
    parameters: [ 'detailed', '2025-08-31', '2025-09-21' ]
  },
  original: error: function get_sales_reports(unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 236,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_reports($1, $2, $3) as report',
    parameters: [ 'detailed', '2025-08-31', '2025-09-21' ]
  },
  sql: 'SELECT get_sales_reports($1, $2, $3) as report',
  parameters: [ 'detailed', '2025-08-31', '2025-09-21' ]
}
Error generating sales reports: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:3499:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_reports(unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 236,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_reports($1, $2, $3) as report',
    parameters: [ 'product', '2025-08-31', '2025-09-21' ]
  },
  original: error: function get_sales_reports(unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 236,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_reports($1, $2, $3) as report',
    parameters: [ 'product', '2025-08-31', '2025-09-21' ]
  },
  sql: 'SELECT get_sales_reports($1, $2, $3) as report',
  parameters: [ 'product', '2025-08-31', '2025-09-21' ]
}
Error generating sales reports: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:3499:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_reports(unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 236,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_reports($1, $2, $3) as report',
    parameters: [ 'summary', '2025-08-31', '2025-09-21' ]
  },
  original: error: function get_sales_reports(unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 236,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_reports($1, $2, $3) as report',
    parameters: [ 'summary', '2025-08-31', '2025-09-21' ]
  },
  sql: 'SELECT get_sales_reports($1, $2, $3) as report',
  parameters: [ 'summary', '2025-08-31', '2025-09-21' ]
}
  method: 'GET',
  url: '/api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-21&reportType=product',
  statusCode: 500,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584599439221b3zpdf38'
}
Error generating sales reports: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:3499:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_reports(unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
[INFO] GET /api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-21&reportType=summary - 500 - 13ms {
  method: 'GET',
  url: '/api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-21&reportType=summary',
  statusCode: 500,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459943919brcfd95an'
}
[INFO] GET /api/sales/customers?limit=1000 - 304 - 22ms {
  method: 'GET',
  url: '/api/sales/customers?limit=1000',
  statusCode: 304,
  responseTime: 22,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758459943912zxcrcz2dq'
}
[INFO] GET /api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-21&reportType=customer - 500 - 14ms {
  method: 'GET',
  url: '/api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-21&reportType=customer',
  statusCode: 500,
  responseTime: 14,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175845994392268scgy8yy'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758459944115 - 200 - 4ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758459944115',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758459943982be70a80dd'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
    length: 236,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_reports($1, $2, $3) as report',
    parameters: [ 'customer', '2025-08-31', '2025-09-21' ]
  },
  original: error: function get_sales_reports(unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 236,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_reports($1, $2, $3) as report',
    parameters: [ 'customer', '2025-08-31', '2025-09-21' ]
  },
  sql: 'SELECT get_sales_reports($1, $2, $3) as report',
  parameters: [ 'customer', '2025-08-31', '2025-09-21' ]
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Notification.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:06:17.944 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '618',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 7ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '162.158.116.46',
  userId: 1,
  username: 'admin',
  requestId: '17584599779412ib0xs3x4'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:06:17.944 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:06:17.944 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:06:44.706 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '162.158.116.46',
  userId: 1,
  username: 'admin',
  requestId: '1758460004703w5cr6oxwv'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 5ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '162.158.116.46',
  userId: 1,
  username: 'admin',
  requestId: '1758460064937q8lj7i03g'
}
[INFO] System metrics {
  metrics: {
    uptime: 1200049,
    requests: 67,
    errors: 0,
    errorRate: 0,
    averageResponseTime: 14,
    activeConnections: 0,
    memory: {
      rss: 102879232,
      heapTotal: 36073472,
      heapUsed: 33555352,
      external: 3815536,
      arrayBuffers: 501934
    },
    cpu: { user: 1646783, system: 394919 },
    system: {
      platform: 'linux',
      arch: 'x64',
      nodeVersion: 'v18.20.5',
      totalMemory: 8326750208,
      freeMemory: 6868758528,
      loadAverage: [Array],
      uptime: 912361.98
    }
  }
}
[INFO] Database metrics {
  database: {
    connected: true,
    connectionTime: 1,
    pool: { size: 2, available: 2, using: 0, waiting: 0 }
  }
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 7ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '162.158.116.46',
  userId: 1,
  username: 'admin',
  requestId: '1758460099945c7lldrpd9'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:06:44.706 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:06:44.706 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:07:44.940 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:07:44.940 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:07:44.940 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:08:19.949 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:08:19.949 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:08:19.949 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:09:38.655 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '162.158.116.46',
  userId: 1,
  username: 'admin',
  requestId: '1758460178652r7684bq7t'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:09:38.655 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:09:38.655 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async Notification.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async Notification.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:233:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:09:53.603 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 200,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
    position: '146',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:09:53.603 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 5ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '162.158.116.46',
  userId: 1,
  username: 'admin',
  requestId: '1758460193600v0w5nin88'
}
[INFO] System metrics {
  metrics: {
    uptime: 1500049,
    requests: 70,
    errors: 0,
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 13:09:53.603 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
    errorRate: 0,
    averageResponseTime: 13,
    activeConnections: 0,
    memory: {
      rss: 103059456,
      heapTotal: 36073472,
      heapUsed: 33800456,
      external: 3807551,
      arrayBuffers: 493949
    },
    cpu: { user: 1713429, system: 410620 },
    system: {
      platform: 'linux',
      arch: 'x64',
      nodeVersion: 'v18.20.5',
      totalMemory: 8326750208,
      freeMemory: 6896140288,
      loadAverage: [Array],
      uptime: 912661.99
    }
  }
}