npm warn config production Use `--omit=dev` instead.

> golden-horse-server@1.0.0 start
> node src/server.js

🔍 Database Configuration Debug:
  - NODE_ENV: production
  - DB_URL present: true
  - DATABASE_URL present: false
  - Raw DATABASE_URL starts with: N/A
  - Cleaned DATABASE_URL present: true
  - Final DATABASE_URL length: 115
  - Final DATABASE_URL starts with: postgres://post...
🔍 Environment: "production" (original: "production")
🔗 Using database URL connection
🔍 Database URL value: Set (hidden for security)
🔍 URL source: DB_URL
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
✅ Database query test successful - Current time: Sun Sep 21 2025 10:55:32 GMT+0000 (Coordinated Universal Time)
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
[INFO] GET /api/health - 200 - 7ms {
  method: 'GET',
  url: '/api/health',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452138759eggxs1qm3'
}
[INFO] GET /api/financial/summary - 401 - 3ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 401,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452155497lv06ykg94'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452161841 - 200 - 7ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452161841',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '17584521612224kuujr8zv'
}
[INFO] GET /api/sales/summary - 401 - 1ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 401,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452161508p3w8nnoyo'
}
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 401 - 1ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 401,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452176834b6ogdpmvm'
}
[INFO] POST /api/auth/login - 200 - 109ms {
  method: 'POST',
  url: '/api/auth/login',
  statusCode: 200,
  responseTime: 109,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452188455gxh9zxugm'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
npm warn config production Use `--omit=dev` instead.
⚠️  تحذير: تعذر ضمان AccountMapping الافتراضي: column "salesTaxAccount" does not exist
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
[INFO] GET /api/sales/summary - 500 - 13ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452188690zrt16i8y7'
}
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
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 29ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 29,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584521886930wgykbb14'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 19ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 19,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:56:28.742 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:56:28.742 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:56:28.742 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
  userId: 1,
  username: 'admin',
  requestId: '1758452188733qorrn30xy'
}
[INFO] GET /api/settings - 200 - 14ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 14,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452188739adywfiw11'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/roles - 304 - 13ms {
  method: 'GET',
  url: '/api/admin/roles',
  statusCode: 304,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452188786z1c5f4a2a'
}
[INFO] GET /api/admin/users - 304 - 16ms {
  method: 'GET',
  url: '/api/admin/users',
  statusCode: 304,
  responseTime: 16,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452188784vfliq0jhp'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
[INFO] GET /api/admin/system-stats - 200 - 16ms {
  method: 'GET',
  url: '/api/admin/system-stats',
  statusCode: 200,
  responseTime: 16,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452188787lvl2s7wfi'
}
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/overview - 200 - 27ms {
  method: 'GET',
  url: '/api/admin/overview',
  statusCode: 200,
  responseTime: 27,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452188806uv85utv3q'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
📁 Current logo request
✅ تم العثور على مستخدم admin: admin (1)
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452189484 - 200 - 6ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452189484',
  statusCode: 200,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '17584521888700ajvy6ug7'
}
[INFO] GET /api/settings - 200 - 14ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 14,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584521888659ws1bh1rj'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452189629 - 200 - 3ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452189629',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452189021x9aguga41'
}
[INFO] GET /assets/index-DbXQBNN4.css - 200 - 3ms {
  method: 'GET',
  url: '/assets/index-DbXQBNN4.css',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758452191498bznf3oyze'
}
[INFO] GET /api/financial/summary - 401 - 1ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 401,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '17584521989410sjzvy7m3'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/summary - 500 - 9ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452205842m81fswexn'
}
[INFO] GET /api/sales/customers?limit=10 - 304 - 17ms {
  method: 'GET',
  url: '/api/sales/customers?limit=10',
  statusCode: 304,
  responseTime: 17,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452205845mn7jnsi2m'
}
[INFO] GET /sales/invoice-management - 200 - 3ms {
  method: 'GET',
  url: '/sales/invoice-management',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452209903oyry2tbg7'
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
  requestId: '1758452210032d90e4dxwp'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 304 - 3ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 304,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452210268d6uz210z6'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 5ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452210403rs25kjyri'
}
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 8ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522104065wgborr54'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:56:50.410 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:56:50.410 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:56:50.410 +00:00')) AND "Notification"."isActive" = true;`,
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
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/summary - 500 - 2ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
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
  requestId: '1758452210421e2wco2n3c'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/financial/summary - 200 - 27ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 27,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452210418ubla98oyi'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
[INFO] GET /api/sales/invoices?page=1&limit=10 - 500 - 7ms {
  method: 'GET',
  url: '/api/sales/invoices?page=1&limit=10',
  statusCode: 500,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452210440bidmhhdua'
}
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/shipping-invoices?page=1&limit=10 - 500 - 9ms {
  method: 'GET',
  url: '/api/sales/shipping-invoices?page=1&limit=10',
  statusCode: 500,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452210444v9kn9lvtu'
}
[INFO] GET /api/sales/customers?page=1&limit=100 - 304 - 11ms {
  method: 'GET',
  url: '/api/sales/customers?page=1&limit=100',
  statusCode: 304,
  responseTime: 11,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452210451hkyymdbnw'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings/logo?t=1758452211117 - 200 - 3ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452211117',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '17584522105040bnsmak0v'
}
[INFO] GET /api/settings - 200 - 14ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 14,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452210498mq17y1gur'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452211220 - 200 - 3ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452211220',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '17584522106069gikx16ge'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452240808hkx47c9wc'
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
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452254230p07m6dcxk'
}
[INFO] GET /sales/inventory - 200 - 1ms {
  method: 'GET',
  url: '/sales/inventory',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '17584522563451td6hx13q'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 304 - 3ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 304,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452256554z90csxl5p'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 5ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452256710d2jwr5boc'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ تم تحويل userId من 1 إلى 1 في notifications
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 9ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522567182al3uztnh'
}
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/summary - 500 - 9ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452256728nd0u0qvhe'
}
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 32ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 32,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452256720x4vmsmiem'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/shipments?page=1&limit=10 - 304 - 13ms {
  method: 'GET',
  url: '/api/sales/shipments?page=1&limit=10',
  statusCode: 304,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522567651io5yxgau'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 8ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522568252gm9hfcgy'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452257451 - 200 - 2ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452257451',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452256854ayhtwutcl'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452257551 - 200 - 2ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452257551',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452256936t0umlodwb'
}
[INFO] GET /sales/warehouse-release-orders - 200 - 1ms {
  method: 'GET',
  url: '/sales/warehouse-release-orders',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452261887l9axvrumm'
}
Error fetching invoices: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Invoice.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async file:///app/server/src/routes/sales.js:554:22 {
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
Error fetching shipping invoices: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async ShippingInvoice.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
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
    length: 200,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "ShippingInvoice.customer_id".',
    position: '1683',
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
    sql: 'SELECT "ShippingInvoice"."id", "ShippingInvoice"."invoiceNumber", "ShippingInvoice"."customerId", "ShippingInvoice"."shipmentId", "ShippingInvoice"."trackingNumber", "ShippingInvoice"."date", "ShippingInvoice"."dueDate", "ShippingInvoice"."shippingCost", "ShippingInvoice"."handlingFee", "ShippingInvoice"."storageFee", "ShippingInvoice"."customsClearanceFee", "ShippingInvoice"."insuranceFee", "ShippingInvoice"."additionalFees", "ShippingInvoice"."discountAmount", "ShippingInvoice"."subtotal", "ShippingInvoice"."taxAmount", "ShippingInvoice"."total", "ShippingInvoice"."paidAmount", "ShippingInvoice"."currency", "ShippingInvoice"."exchangeRate", "ShippingInvoice"."status", "ShippingInvoice"."paymentStatus", "ShippingInvoice"."paymentMethod", "ShippingInvoice"."paymentReference", "ShippingInvoice"."itemDescription", "ShippingInvoice"."itemDescriptionEn", "ShippingInvoice"."quantity", "ShippingInvoice"."weight", "ShippingInvoice"."volume", "ShippingInvoice"."originLocation", "ShippingInvoice"."destinationLocation", "ShippingInvoice"."notes", "ShippingInvoice"."internalNotes", "ShippingInvoice"."terms", "ShippingInvoice"."createdBy", "ShippingInvoice"."createdAt", "ShippingInvoice"."updatedAt", "customer"."id" AS "customer.id", "customer"."code" AS "customer.code", "customer"."name" AS "customer.name", "customer"."phone" AS "customer.phone", "customer"."email" AS "customer.email", "shipment"."id" AS "shipment.id", "shipment"."trackingNumber" AS "shipment.trackingNumber", "shipment"."status" AS "shipment.status", "shipment"."itemDescription" AS "shipment.itemDescription" FROM "shipping_invoices" AS "ShippingInvoice" LEFT OUTER JOIN "customers" AS "customer" ON "ShippingInvoice"."customerId" = "customer"."id" LEFT OUTER JOIN "shipments" AS "shipment" ON "ShippingInvoice"."shipmentId" = "shipment"."id" ORDER BY "ShippingInvoice"."date" DESC LIMIT 10 OFFSET 0;',
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
    length: 200,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: 'Perhaps you meant to reference the column "ShippingInvoice.customer_id".',
    position: '1683',
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
    sql: 'SELECT "ShippingInvoice"."id", "ShippingInvoice"."invoiceNumber", "ShippingInvoice"."customerId", "ShippingInvoice"."shipmentId", "ShippingInvoice"."trackingNumber", "ShippingInvoice"."date", "ShippingInvoice"."dueDate", "ShippingInvoice"."shippingCost", "ShippingInvoice"."handlingFee", "ShippingInvoice"."storageFee", "ShippingInvoice"."customsClearanceFee", "ShippingInvoice"."insuranceFee", "ShippingInvoice"."additionalFees", "ShippingInvoice"."discountAmount", "ShippingInvoice"."subtotal", "ShippingInvoice"."taxAmount", "ShippingInvoice"."total", "ShippingInvoice"."paidAmount", "ShippingInvoice"."currency", "ShippingInvoice"."exchangeRate", "ShippingInvoice"."status", "ShippingInvoice"."paymentStatus", "ShippingInvoice"."paymentMethod", "ShippingInvoice"."paymentReference", "ShippingInvoice"."itemDescription", "ShippingInvoice"."itemDescriptionEn", "ShippingInvoice"."quantity", "ShippingInvoice"."weight", "ShippingInvoice"."volume", "ShippingInvoice"."originLocation", "ShippingInvoice"."destinationLocation", "ShippingInvoice"."notes", "ShippingInvoice"."internalNotes", "ShippingInvoice"."terms", "ShippingInvoice"."createdBy", "ShippingInvoice"."createdAt", "ShippingInvoice"."updatedAt", "customer"."id" AS "customer.id", "customer"."code" AS "customer.code", "customer"."name" AS "customer.name", "customer"."phone" AS "customer.phone", "customer"."email" AS "customer.email", "shipment"."id" AS "shipment.id", "shipment"."trackingNumber" AS "shipment.trackingNumber", "shipment"."status" AS "shipment.status", "shipment"."itemDescription" AS "shipment.itemDescription" FROM "shipping_invoices" AS "ShippingInvoice" LEFT OUTER JOIN "customers" AS "customer" ON "ShippingInvoice"."customerId" = "customer"."id" LEFT OUTER JOIN "shipments" AS "shipment" ON "ShippingInvoice"."shipmentId" = "shipment"."id" ORDER BY "ShippingInvoice"."date" DESC LIMIT 10 OFFSET 0;',
    parameters: undefined
  },
  sql: 'SELECT "ShippingInvoice"."id", "ShippingInvoice"."invoiceNumber", "ShippingInvoice"."customerId", "ShippingInvoice"."shipmentId", "ShippingInvoice"."trackingNumber", "ShippingInvoice"."date", "ShippingInvoice"."dueDate", "ShippingInvoice"."shippingCost", "ShippingInvoice"."handlingFee", "ShippingInvoice"."storageFee", "ShippingInvoice"."customsClearanceFee", "ShippingInvoice"."insuranceFee", "ShippingInvoice"."additionalFees", "ShippingInvoice"."discountAmount", "ShippingInvoice"."subtotal", "ShippingInvoice"."taxAmount", "ShippingInvoice"."total", "ShippingInvoice"."paidAmount", "ShippingInvoice"."currency", "ShippingInvoice"."exchangeRate", "ShippingInvoice"."status", "ShippingInvoice"."paymentStatus", "ShippingInvoice"."paymentMethod", "ShippingInvoice"."paymentReference", "ShippingInvoice"."itemDescription", "ShippingInvoice"."itemDescriptionEn", "ShippingInvoice"."quantity", "ShippingInvoice"."weight", "ShippingInvoice"."volume", "ShippingInvoice"."originLocation", "ShippingInvoice"."destinationLocation", "ShippingInvoice"."notes", "ShippingInvoice"."internalNotes", "ShippingInvoice"."terms", "ShippingInvoice"."createdBy", "ShippingInvoice"."createdAt", "ShippingInvoice"."updatedAt", "customer"."id" AS "customer.id", "customer"."code" AS "customer.code", "customer"."name" AS "customer.name", "customer"."phone" AS "customer.phone", "customer"."email" AS "customer.email", "shipment"."id" AS "shipment.id", "shipment"."trackingNumber" AS "shipment.trackingNumber", "shipment"."status" AS "shipment.status", "shipment"."itemDescription" AS "shipment.itemDescription" FROM "shipping_invoices" AS "ShippingInvoice" LEFT OUTER JOIN "customers" AS "customer" ON "ShippingInvoice"."customerId" = "customer"."id" LEFT OUTER JOIN "shipments" AS "shipment" ON "ShippingInvoice"."shipmentId" = "shipment"."id" ORDER BY "ShippingInvoice"."date" DESC LIMIT 10 OFFSET 0;',
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:20.811 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:20.811 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:20.811 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:34.234 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:34.234 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:34.234 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:36.722 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:36.722 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:36.722 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
    '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
    '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
    '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
    '      FROM sales_invoices si\n' +
    '      LEFT JOIN shipments s ON true\n' +
    '      WHERE si."isActive" = true',
  parameters: {}
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 304 - 4ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 304,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452262084azmriwui8'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
[INFO] GET /api/settings - 200 - 6ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452262233yh41eiu6v'
}
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 7ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452262236fwtbgg9xz'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/summary - 500 - 8ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:42.240 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:42.240 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:42.240 +00:00')) AND "Notification"."isActive" = true;`,
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
    '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
    '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
    '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
    '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
    '      FROM sales_invoices si\n' +
    '      LEFT JOIN shipments s ON true\n' +
    '      WHERE si."isActive" = true',
  parameters: {}
}
  requestId: '1758452262254n8kjw3jru'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 23ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 23,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452262244l7jn3zwht'
}
Error fetching receipt vouchers: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/financial.js:8272:25 {
  name: 'SequelizeDatabaseError',
  parent: error: column r.isActive does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 108,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '60',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3716',
    routine: 'errorMissingColumn',
    sql: 'SELECT COUNT(*) as count\n' +
      '      FROM receipts r\n' +
      '      WHERE r."isActive" = true',
    parameters: []
  },
  original: error: column r.isActive does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 108,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '60',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
[INFO] GET /api/financial/vouchers/receipts?limit=50 - 500 - 5ms {
  method: 'GET',
  url: '/api/financial/vouchers/receipts?limit=50',
  statusCode: 500,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452262264tf6j7nvyo'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 3ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522623339u8o8r163'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452262954 - 200 - 3ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452262954',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452262342u0i494q12'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452263045 - 200 - 2ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452263045',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452262428p7r2ij64o'
}
[INFO] GET /sales/invoice-management - 304 - 1ms {
  method: 'GET',
  url: '/sales/invoice-management',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452266426i6np42yeq'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 304 - 2ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 304,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452266650titmjbdb6'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 4ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452266780zfkxac6mp'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ تم تحويل userId من 1 إلى 1 في notifications
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3716',
    routine: 'errorMissingColumn',
    sql: 'SELECT COUNT(*) as count\n' +
      '      FROM receipts r\n' +
      '      WHERE r."isActive" = true',
    parameters: []
  },
  sql: 'SELECT COUNT(*) as count\n' +
    '      FROM receipts r\n' +
    '      WHERE r."isActive" = true',
  parameters: []
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
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522667945nj7ig8dj'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
✅ تم العثور على مستخدم admin: admin (1)
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_oper.c',
    line: '635',
    routine: 'op_error',
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:46.797 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:46.797 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:46.797 +00:00')) AND "Notification"."isActive" = true;`,
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
[INFO] GET /api/sales/summary - 500 - 6ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452266802c6p684qnm'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
    '        COALESCE(SUM(si."totalAmount"), 0) as total_sales,\n' +
    '        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,\n' +
    '        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,\n' +
    '        COALESCE(SUM(s."totalAmount"), 0) as shipping_revenue\n' +
    '      FROM sales_invoices si\n' +
    '      LEFT JOIN shipments s ON true\n' +
    '      WHERE si."isActive" = true',
  parameters: {}
}
Error fetching invoices: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Invoice.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async file:///app/server/src/routes/sales.js:554:22 {
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
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/invoices?page=1&limit=10 - 500 - 5ms {
  method: 'GET',
  url: '/api/sales/invoices?page=1&limit=10',
  statusCode: 500,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452266812yn7u3ob5n'
}
[INFO] GET /api/financial/summary - 200 - 18ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 18,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452266802o6kdtpke9'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
[INFO] GET /api/sales/shipping-invoices?page=1&limit=10 - 500 - 7ms {
  method: 'GET',
  url: '/api/sales/shipping-invoices?page=1&limit=10',
  statusCode: 500,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452266818g73ywx0bf'
}
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/customers?page=1&limit=100 - 304 - 13ms {
  method: 'GET',
  url: '/api/sales/customers?page=1&limit=100',
  statusCode: 304,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452266823am8q2fdfk'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452267502 - 200 - 3ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452267502',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452266885x70sss345'
}
[INFO] GET /api/settings - 200 - 9ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452266883netg7logq'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758452267645 - 200 - 3ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758452267645',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452267027j0my447o5'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/users - 304 - 7ms {
  method: 'GET',
  url: '/api/admin/users',
  statusCode: 304,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522734866ao6dzjb2'
}
[INFO] GET /api/admin/roles - 304 - 15ms {
  method: 'GET',
  url: '/api/admin/roles',
  statusCode: 304,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452273486gz337fpgn'
}
[INFO] GET /api/admin/system-stats - 200 - 15ms {
  method: 'GET',
  url: '/api/admin/system-stats',
  statusCode: 200,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452273489rnhoun4nv'
}
[INFO] GET /api/admin/overview - 200 - 30ms {
  method: 'GET',
  url: '/api/admin/overview',
  statusCode: 200,
  responseTime: 30,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452273490et5rwhfq0'
}
[INFO] GET /assets/FinancialDashboard-OLKO1EjD.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/FinancialDashboard-OLKO1EjD.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.180',
  userId: undefined,
  username: undefined,
  requestId: '1758452275846s1dcwqv4d'
}
[INFO] GET /assets/arrow-up-right-DNjMo-FG.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/arrow-up-right-DNjMo-FG.js',
  statusCode: 200,
  responseTime: 1,
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
}
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.186',
  userId: undefined,
  username: undefined,
  requestId: '1758452275876wgxd3z1rs'
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:58.732 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 15ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452278723bpzlbm1li'
}
[INFO] GET /assets/ChartOfAccounts-BnwPhz_s.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/ChartOfAccounts-BnwPhz_s.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.192',
  userId: undefined,
  username: undefined,
  requestId: '1758452279064568rju4g0'
}
[INFO] GET /assets/Modal-CImnq1c6.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/Modal-CImnq1c6.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.137',
  userId: undefined,
  username: undefined,
  requestId: '1758452279076e4qf8vg4b'
}
[INFO] GET /assets/SearchFilter-K4jV2oxM.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/SearchFilter-K4jV2oxM.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.156',
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:58.732 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:57:58.732 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
  userId: undefined,
  username: undefined,
  requestId: '17584522790778qnfu00ha'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/financial/accounts?limit=1000 - 200 - 19ms {
  method: 'GET',
  url: '/api/financial/accounts?limit=1000',
  statusCode: 200,
  responseTime: 19,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452279217iddd44kdo'
}
[INFO] GET /assets/save-By_GsION.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/save-By_GsION.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.180',
  userId: undefined,
  username: undefined,
  requestId: '17584522948482jrva9r3c'
}
[INFO] GET /assets/JournalEntries-DVFUCp2l.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/JournalEntries-DVFUCp2l.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.194',
  userId: undefined,
  username: undefined,
  requestId: '1758452294927mojyf3ro6'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/financial/accounts - 200 - 17ms {
  method: 'GET',
  url: '/api/financial/accounts',
  statusCode: 200,
  responseTime: 17,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522950772id2kdp7d'
}
[INFO] GET /api/financial/journal-entries?page=1&limit=10 - 304 - 35ms {
  method: 'GET',
  url: '/api/financial/journal-entries?page=1&limit=10',
  statusCode: 304,
  responseTime: 35,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452295074u73z5157m'
}
[INFO] GET /assets/AccountStatement-Zz0Im7v8.css - 200 - 2ms {
  method: 'GET',
  url: '/assets/AccountStatement-Zz0Im7v8.css',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.134',
  userId: undefined,
  username: undefined,
  requestId: '1758452299228d3y5kxlsb'
}
[INFO] GET /assets/AccountStatement-DeCuaXM_.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/AccountStatement-DeCuaXM_.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.200',
  userId: undefined,
  username: undefined,
  requestId: '1758452299233otfkcp8us'
}
[INFO] GET /assets/printer-DQyN7YFf.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/printer-DQyN7YFf.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.148',
  userId: undefined,
  username: undefined,
  requestId: '1758452299244b2sl20ytz'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/financial/accounts?limit=1000 - 304 - 9ms {
  method: 'GET',
  url: '/api/financial/accounts?limit=1000',
  statusCode: 304,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584522994643ifbdnx1p'
}
WebSocket: User not found, allowing connection without auth
User Anonymous connected (h0vFKpqWXaBPD_6SAAAB)
User Anonymous disconnected (h0vFKpqWXaBPD_6SAAAB)
[INFO] GET /assets/formatters-wItpbXXQ.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/formatters-wItpbXXQ.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.179',
  userId: undefined,
  username: undefined,
  requestId: '1758452304261ckemi96p8'
}
[INFO] GET /assets/FixedAssetsManagement-BlONBRXk.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/FixedAssetsManagement-BlONBRXk.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.199',
  userId: undefined,
  username: undefined,
  requestId: '17584523042722fkc24tjv'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 Fetching fixed asset categories...
🔧 Ensuring fixed assets structure...
🔧 ensureFixedAssetsStructure: Starting...
🔍 Looking for Fixed Assets parent account...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 Fixed Assets parent search result: الأصول الثابتة 1.2
✅ Found existing Fixed Assets parent: الأصول الثابتة 1.2
🔧 Ensuring default categories...
🔍 Ensuring category: سيارات (Vehicles)
✅ Found existing category: وسائل نقل (1.2.4)
🔍 Ensuring category: معدات وآلات (Equipment and Machinery)
✅ Found existing category: معدات وآلات (1.2.6)
🔍 Ensuring category: أثاث (Furniture)
✅ Found existing category: أثاث ومفروشات (1.2.3)
✅ All categories ensured
✅ Fixed assets structure ensured, parent: الأصول الثابتة 1.2
🔍 Finding categories under parent ID: ff17325f-5c98-450e-af3a-b0d7b4e27484
🔍 Found 4 sub-groups under Fixed Assets
✅ Found 8 fixed asset categories (under Fixed Assets)
[INFO] GET /api/financial/fixed-assets/categories - 304 - 12ms {
  method: 'GET',
  url: '/api/financial/fixed-assets/categories',
  statusCode: 304,
  responseTime: 12,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452304408i3f3yecmz'
}
[INFO] GET /api/financial/fixed-assets?page=1&limit=10 - 304 - 14ms {
  method: 'GET',
  url: '/api/financial/fixed-assets?page=1&limit=10',
  statusCode: 304,
  responseTime: 14,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452304411lczo26862'
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:58:28.729 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452308726rt6l7zx6j'
}
[INFO] GET /assets/CustomersManagement-D09jDToj.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/CustomersManagement-D09jDToj.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.199',
  userId: undefined,
  username: undefined,
  requestId: '1758452312725yump23xq1'
    routine: 'op_error',
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:58:28.729 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:58:28.729 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
}
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/financial/customers?page=1&limit=10 - 200 - 17ms {
  method: 'GET',
  url: '/api/financial/customers?page=1&limit=10',
  statusCode: 200,
  responseTime: 17,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452312836jtssbw4oh'
}
[INFO] GET /assets/FormField-BAhJiHpH.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/FormField-BAhJiHpH.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758452316750j9zx0wx3y'
}
[INFO] GET /assets/EmployeeManagement-CWh6m1S5.js - 200 - 0ms {
  method: 'GET',
  url: '/assets/EmployeeManagement-CWh6m1S5.js',
  statusCode: 200,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.186',
  userId: undefined,
  username: undefined,
  requestId: '1758452316766pecngzuqq'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/financial/employees?search=&department=&position= - 304 - 8ms {
  method: 'GET',
  url: '/api/financial/employees?search=&department=&position=',
  statusCode: 304,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '17584523168904s5o9sxgq'
}
[INFO] GET /assets/EmployeeAccountStatementNew-Dq6wNRsl.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/EmployeeAccountStatementNew-Dq6wNRsl.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.199',
  userId: undefined,
  username: undefined,
  requestId: '175845231950288r3i8355'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/financial/employees?search=&department= - 304 - 4ms {
  method: 'GET',
  url: '/api/financial/employees?search=&department=',
  statusCode: 304,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452319617cn6memrk0'
}
[INFO] GET /assets/FinancialReports-DEI5ctD4.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/FinancialReports-DEI5ctD4.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.179',
  userId: undefined,
  username: undefined,
  requestId: '1758452322022x69neh9zi'
}
[INFO] GET /assets/pie-chart-Ca830x-U.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/pie-chart-Ca830x-U.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.179',
  userId: undefined,
  username: undefined,
  requestId: '1758452322054capeallu7'
}
[INFO] GET /assets/calendar-DMLPJzdc.js - 200 - 0ms {
  method: 'GET',
  url: '/assets/calendar-DMLPJzdc.js',
  statusCode: 200,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.192',
  userId: undefined,
  username: undefined,
  requestId: '1758452322056l65qaw6nb'
}
[INFO] GET /assets/book-open-CQvGTjGd.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/book-open-CQvGTjGd.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.199',
  userId: undefined,
  username: undefined,
  requestId: '1758452322062kigywnpl5'
}
🔍 جلب ميزان المراجعة الافتتاحي...
📅 كما في تاريخ: 2025-09-21
[INFO] GET /api/financial/reports/opening-trial-balance?asOfDate=2025-09-21&currency=LYD - 200 - 15ms {
  method: 'GET',
  url: '/api/financial/reports/opening-trial-balance?asOfDate=2025-09-21&currency=LYD',
  statusCode: 200,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '17584523221895pkl4lb7i'
}
🔍 جلب ميزان المراجعة من 2024-12-31 إلى 2025-09-21
[INFO] GET /api/financial/reports/trial-balance?dateFrom=2024-12-31&dateTo=2025-09-21&currency=LYD - 200 - 9ms {
  method: 'GET',
  url: '/api/financial/reports/trial-balance?dateFrom=2024-12-31&dateTo=2025-09-21&currency=LYD',
  statusCode: 200,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  ip: '172.69.211.182',
  userId: undefined,
  username: undefined,
  requestId: '1758452324639gs1hwlupr'
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
  ip: '172.69.211.182',
  userId: 1,
  username: 'admin',
  requestId: '1758452339247iyop9rnf2'
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:58:59.250 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:58:59.250 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 10:58:59.250 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}