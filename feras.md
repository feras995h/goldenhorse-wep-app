golden-horse-server@1.0.0 start
> node src/server.js

🔍 Database Configuration Debug:
  - NODE_ENV: production
  - DB_URL present: true
  - DATABASE_URL present: false
  - Raw DATABASE_URL starts with: N/A
  - Cleaned DATABASE_URL present: true
  - Final DATABASE_URL length: 123
  - Final DATABASE_URL starts with: postgres://post...
🔍 Environment: "production" (original: "production")
🔗 Using database URL connection
🔍 Database URL value: Set (hidden for security)
🔍 URL source: DB_URL
🔍 URL Debug Info:
  - URL length: 123
  - URL first 20 chars: postgres://postgres:
  - URL contains ://: true
  - URL starts with =: false
  - URL starts with postgresql: false
  - URL starts with postgres: true
🔍 Parsed URL Info:
  - Protocol: postgres:
  - Host: s4sogs888gswckoosgcwkss0
  - Port: 5432
  - Database: /postgres
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
✅ Database query test successful - Current time: Sun Sep 21 2025 09:53:24 GMT+0000 (Coordinated Universal Time)
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
[INFO] GET / - 200 - 5ms {
  method: 'GET',
  url: '/',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448496243vp5cshe1f'
}
[INFO] GET /assets/index-Cbf5uQ_G.js - 200 - 13ms {
  method: 'GET',
  url: '/assets/index-Cbf5uQ_G.js',
  statusCode: 200,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448496455mrkm2ohdf'
}
[INFO] GET /assets/index-DbXQBNN4.css - 200 - 1ms {
  method: 'GET',
  url: '/assets/index-DbXQBNN4.css',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '17584484965475i9wpecrx'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448497342 - 200 - 10ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448497342',
  statusCode: 200,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
npm warn config production Use `--omit=dev` instead.
npm warn config production Use `--omit=dev` instead.
⚠️  تحذير: تعذر ضمان AccountMapping الافتراضي: column "salesTaxAccount" does not exist
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448497172klin43k60'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448497342 - 200 - 2ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448497342',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448497338rktdps0rd'
}
[INFO] GET /logo.png - 200 - 2ms {
  method: 'GET',
  url: '/logo.png',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.148',
  userId: undefined,
  username: undefined,
  requestId: '1758448497493bkz2pflsx'
}
[INFO] POST /api/auth/login - 200 - 101ms {
  method: 'POST',
  url: '/api/auth/login',
  statusCode: 200,
  responseTime: 101,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485067589nmkatpxb'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/sales/summary - 500 - 12ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 12,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448507165szjr5od7t'
}
[INFO] GET /api/financial/summary - 200 - 34ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 34,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448507150cc8zmfvqj'
}
[INFO] GET /assets/AdminDashboard-CN4h98ev.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/AdminDashboard-CN4h98ev.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448507214ilusrpzry'
}
[INFO] GET /assets/minus-FoHOd1Y3.js - 200 - 4ms {
  method: 'GET',
  url: '/assets/minus-FoHOd1Y3.js',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448507220c8y7rti3k'
}
[INFO] GET /assets/receipt-C0nct9nA.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/receipt-C0nct9nA.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758448507245qne2ut292'
}
[INFO] GET /assets/x-circle-8bRb-lwt.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/x-circle-8bRb-lwt.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485072617yyqfftkg'
}
[INFO] GET /assets/check-circle-DqpQDrFD.js - 200 - 7ms {
  method: 'GET',
  url: '/assets/check-circle-DqpQDrFD.js',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1264:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  original: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  sql: 'SELECT get_sales_summary($1, $2) as summary',
  parameters: [ null, null ]
}
  requestId: '1758448507278s0fu4zdl0'
}
[INFO] GET /assets/pen-square-CGLjWnZX.js - 200 - 6ms {
  method: 'GET',
  url: '/assets/pen-square-CGLjWnZX.js',
  statusCode: 200,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758448507278ms6vbrlfe'
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:07.329 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:07.329 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 43ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 43,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448507305gd1bcvma4'
}
[INFO] GET /api/settings - 200 - 50ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 50,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175844850730315bkvwmst'
}
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /assets/trending-down-B_beGuxu.js - 200 - 6ms {
  method: 'GET',
  url: '/assets/trending-down-B_beGuxu.js',
  statusCode: 200,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.189',
  userId: undefined,
  username: undefined,
  requestId: '1758448507349siffwid5a'
}
[INFO] GET /assets/download-BrmsF396.js - 200 - 6ms {
  method: 'GET',
  url: '/assets/download-BrmsF396.js',
  statusCode: 200,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.186',
  userId: undefined,
  username: undefined,
  requestId: '17584485073521czwz6xcp'
}
[INFO] GET /assets/credit-card-Bx5_iLpD.js - 200 - 5ms {
  method: 'GET',
  url: '/assets/credit-card-Bx5_iLpD.js',
  statusCode: 200,
  responseTime: 5,
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:07.329 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.178',
  userId: undefined,
  username: undefined,
  requestId: '1758448507354oy0kzuzzn'
}
[INFO] GET /assets/alert-triangle-DLENkiRX.js - 200 - 6ms {
  method: 'GET',
  url: '/assets/alert-triangle-DLENkiRX.js',
  statusCode: 200,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.134',
  userId: undefined,
  username: undefined,
  requestId: '17584485073564es281jcc'
}
[INFO] GET /assets/package-ad2z-x9-.js - 200 - 7ms {
  method: 'GET',
  url: '/assets/package-ad2z-x9-.js',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.187',
  userId: undefined,
  username: undefined,
  requestId: '1758448507356wro27kong'
}
[INFO] GET /assets/plus-BbvRSdvv.js - 200 - 7ms {
  method: 'GET',
  url: '/assets/plus-BbvRSdvv.js',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.158',
  userId: undefined,
  username: undefined,
  requestId: '1758448507358xzplc7itp'
}
[INFO] GET /assets/refresh-cw-DB9tpC3C.js - 200 - 5ms {
  method: 'GET',
  url: '/assets/refresh-cw-DB9tpC3C.js',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.174',
  userId: undefined,
  username: undefined,
  requestId: '1758448507362bq3n98od9'
}
[INFO] GET /assets/activity-CbQyZMRC.js - 200 - 4ms {
  method: 'GET',
  url: '/assets/activity-CbQyZMRC.js',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.169',
  userId: undefined,
  username: undefined,
  requestId: '1758448507364gr7f39hci'
}
[INFO] GET /assets/alert-circle-t-0xxPpe.js - 200 - 4ms {
  method: 'GET',
  url: '/assets/alert-circle-t-0xxPpe.js',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.192',
  userId: undefined,
  username: undefined,
  requestId: '17584485073646w4l40hfz'
}
[INFO] GET /api/settings - 200 - 19ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 19,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485073511lpv3zoz8'
}
[INFO] GET /assets/bar-chart-3-OMQuOc28.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/bar-chart-3-OMQuOc28.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.201',
  userId: undefined,
  username: undefined,
  requestId: '1758448507369s0ppd7nby'
}
[INFO] GET /assets/info-TygL5W7b.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/info-TygL5W7b.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.193',
  userId: undefined,
  username: undefined,
  requestId: '1758448507378es8j3z332'
}
[INFO] GET /assets/target-DeDY0xXJ.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/target-DeDY0xXJ.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.197',
  userId: undefined,
  username: undefined,
  requestId: '17584485073808zmwdqsv0'
}
[INFO] GET /assets/shield-CDN_75fx.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/shield-CDN_75fx.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.166',
  userId: undefined,
  username: undefined,
  requestId: '1758448507384cj2x64ynx'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
📁 Current logo request
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/users - 200 - 15ms {
  method: 'GET',
  url: '/api/admin/users',
  statusCode: 200,
  responseTime: 15,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448507919xjtev2o18'
}
[INFO] GET /api/admin/roles - 200 - 20ms {
  method: 'GET',
  url: '/api/admin/roles',
  statusCode: 200,
  responseTime: 20,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448507916elcjx1sjt'
}
✅ Current logo found: logo-1758303047268-17121842.PNG
📁 Current logo request
[INFO] GET /api/settings/logo?t=1758448508080 - 200 - 11ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448508080',
  statusCode: 200,
  responseTime: 11,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448507937x3cd8mj8y'
}
[INFO] GET /api/admin/system-stats - 200 - 32ms {
  method: 'GET',
  url: '/api/admin/system-stats',
  statusCode: 200,
  responseTime: 32,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175844850792584ixqc419'
}
[INFO] GET /api/admin/overview - 200 - 43ms {
  method: 'GET',
  url: '/api/admin/overview',
  statusCode: 200,
  responseTime: 43,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448507926si29ncv4c'
}
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448508099 - 200 - 24ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448508099',
  statusCode: 200,
  responseTime: 24,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448507953oyxq44581'
}
[INFO] GET /assets/minus-FoHOd1Y3.js - 304 - 0ms {
  method: 'GET',
  url: '/assets/minus-FoHOd1Y3.js',
  statusCode: 304,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448512902tkl4fym12'
}
[INFO] GET /assets/plus-BbvRSdvv.js - 304 - 0ms {
  method: 'GET',
  url: '/assets/plus-BbvRSdvv.js',
  statusCode: 304,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.158',
  userId: undefined,
  username: undefined,
  requestId: '1758448512903buf0y7b56'
}
[INFO] GET /assets/alert-triangle-DLENkiRX.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/alert-triangle-DLENkiRX.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.134',
  userId: undefined,
  username: undefined,
  requestId: '175844851290442v0zrq3v'
}
[INFO] GET /assets/x-circle-8bRb-lwt.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/x-circle-8bRb-lwt.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448512905g93k3ng5a'
}
[INFO] GET /assets/download-BrmsF396.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/download-BrmsF396.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.186',
  userId: undefined,
  username: undefined,
  requestId: '1758448512906gqfoezcz8'
}
[INFO] GET /assets/pen-square-CGLjWnZX.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/pen-square-CGLjWnZX.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '17584485129062jj0t3623'
}
[INFO] GET /assets/refresh-cw-DB9tpC3C.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/refresh-cw-DB9tpC3C.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.174',
  userId: undefined,
  username: undefined,
  requestId: '1758448512908zc107okgv'
}
[INFO] GET /assets/check-circle-DqpQDrFD.js - 304 - 0ms {
  method: 'GET',
  url: '/assets/check-circle-DqpQDrFD.js',
  statusCode: 304,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758448512908o97nr8kux'
}
[INFO] GET /assets/bar-chart-3-OMQuOc28.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/bar-chart-3-OMQuOc28.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.201',
  userId: undefined,
  username: undefined,
  requestId: '1758448512909643lmg3q7'
}
[INFO] GET /assets/shield-CDN_75fx.js - 304 - 2ms {
  method: 'GET',
  url: '/assets/shield-CDN_75fx.js',
  statusCode: 304,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.166',
  userId: undefined,
  username: undefined,
  requestId: '1758448512909lzj4nvyx0'
}
[INFO] GET /assets/target-DeDY0xXJ.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/target-DeDY0xXJ.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.197',
  userId: undefined,
  username: undefined,
  requestId: '1758448512911lofr814ph'
}
[INFO] GET /assets/activity-CbQyZMRC.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/activity-CbQyZMRC.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.169',
  userId: undefined,
  username: undefined,
  requestId: '1758448512912fjokl3bz8'
}
[INFO] GET /assets/credit-card-Bx5_iLpD.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/credit-card-Bx5_iLpD.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.178',
  userId: undefined,
  username: undefined,
  requestId: '17584485129123ekaqmv8v'
}
[INFO] GET /assets/info-TygL5W7b.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/info-TygL5W7b.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.192',
  userId: undefined,
  username: undefined,
  requestId: '1758448512913p68w8p3wm'
}
[INFO] GET /assets/trending-down-B_beGuxu.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/trending-down-B_beGuxu.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.189',
  userId: undefined,
  username: undefined,
  requestId: '1758448512914qd6pnyjc6'
}
[INFO] GET /assets/receipt-C0nct9nA.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/receipt-C0nct9nA.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.190',
  userId: undefined,
  username: undefined,
  requestId: '1758448512914aladsj790'
}
[INFO] GET /assets/package-ad2z-x9-.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/package-ad2z-x9-.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.186',
  userId: undefined,
  username: undefined,
  requestId: '1758448512915zc1pzwkw8'
}
[INFO] GET /assets/alert-circle-t-0xxPpe.js - 304 - 0ms {
  method: 'GET',
  url: '/assets/alert-circle-t-0xxPpe.js',
  statusCode: 304,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.192',
  userId: undefined,
  username: undefined,
  requestId: '17584485129171iwwm5ipp'
}
[INFO] GET /assets/SalesDashboard-DEqQKG3j.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/SalesDashboard-DEqQKG3j.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.148',
  userId: undefined,
  username: undefined,
  requestId: '1758448524046cl1kyj1ry'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/summary - 500 - 10ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448526256lrbnkaiso'
}
[INFO] GET /api/sales/customers?limit=10 - 500 - 10ms {
  method: 'GET',
  url: '/api/sales/customers?limit=10',
  statusCode: 500,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448526259bwztlc0cs'
}
[INFO] GET /sales/inventory - 200 - 2ms {
  method: 'GET',
  url: '/sales/inventory',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448533759gzut3yct1'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1264:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  original: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  sql: 'SELECT get_sales_summary($1, $2) as summary',
  parameters: [ null, null ]
}
Error fetching customers: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:185:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_customers_list_final(unknown, unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 252,
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
    sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
    parameters: [ 1, 10, null, null ]
  },
  original: error: function get_customers_list_final(unknown, unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 252,
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
    sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
    parameters: [ 1, 10, null, null ]
  },
  sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
  parameters: [ 1, 10, null, null ]
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:37.499 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:37.499 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 10ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448537496we5n5uizh'
}
[INFO] GET /assets/index-Cbf5uQ_G.js - 304 - 0ms {
  method: 'GET',
  url: '/assets/index-Cbf5uQ_G.js',
  statusCode: 304,
  responseTime: 0,
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:37.499 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '175844853786975fl1505z'
}
[INFO] GET /logo.png - 304 - 1ms {
  method: 'GET',
  url: '/logo.png',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.148',
  userId: undefined,
  username: undefined,
  requestId: '17584485379449r7gom0yy'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 200 - 2ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448537960532fuzk5i'
}
[INFO] GET /assets/chevrons-right-B6IigW8S.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/chevrons-right-B6IigW8S.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.189',
  userId: undefined,
  username: undefined,
  requestId: '1758448540468tazeu5ycq'
}
[INFO] GET /assets/SearchFilter-C3mbLl48.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/SearchFilter-C3mbLl48.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.197',
  userId: undefined,
  username: undefined,
  requestId: '1758448540470e4w6ck96z'
}
[INFO] GET /assets/Modal-DCaS_Iw8.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/Modal-DCaS_Iw8.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.134',
  userId: undefined,
  username: undefined,
  requestId: '17584485404967dzpe5eku'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/summary - 500 - 8ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448540536bp8nre1j7'
}
[INFO] GET /api/settings - 200 - 14ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 14,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448540536hgke87jl6'
}
[INFO] GET /api/settings - 200 - 13ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485405407s54b6t04'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
[INFO] GET /assets/chevron-right-B-S2z0UR.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/chevron-right-B-S2z0UR.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.195',
  userId: undefined,
  username: undefined,
  requestId: '1758448540559z3irftjqx'
}
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
[INFO] GET /assets/InventoryManagement-B4FgXLYJ.js - 200 - 2ms {
  method: 'GET',
  url: '/assets/InventoryManagement-B4FgXLYJ.js',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.199',
  userId: undefined,
  username: undefined,
  requestId: '17584485405696vgznj0ip'
}
[INFO] GET /assets/FormField-pzWz9qi8.js - 200 - 4ms {
  method: 'GET',
  url: '/assets/FormField-pzWz9qi8.js',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.199',
  userId: undefined,
  username: undefined,
  requestId: '1758448540579lk7p2qyck'
}
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 39ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 39,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448540558cy19nsobs'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1264:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  original: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  sql: 'SELECT get_sales_summary($1, $2) as summary',
  parameters: [ null, null ]
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Notification.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448540636tfv1bp96j'
}
📁 Current logo request
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448541699 - 200 - 3ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448541699',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485415517f7rhffba'
}
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448541697 - 200 - 5ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448541697',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448541551jgyn62ci0'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/shipments?page=1&limit=10 - 200 - 10ms {
  method: 'GET',
  url: '/api/sales/shipments?page=1&limit=10',
  statusCode: 200,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448541607w6i7how6l'
}
[INFO] GET /sales - 200 - 2ms {
  method: 'GET',
  url: '/sales',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448543929d2mrg2vpk'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 304 - 2ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 304,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448544273zvtbjcg8o'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 4ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448544502l8j0dgaqr'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
✅ تم العثور على مستخدم admin: admin (1)
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:40.639 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:40.639 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:40.639 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
    at async file:///app/server/src/routes/notifications.js:42:20 {
  name: 'SequelizeDatabaseError',
  parent: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 10ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485445180epszu0y9'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
[INFO] GET /api/settings - 200 - 17ms {
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:44.522 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:44.522 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:44.522 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
}
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 17,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448544520uz18hhnll'
}
✅ تم العثور على مستخدم admin: admin (1)
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1264:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  original: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
    severity: 'ERROR',
    code: '42883',
    detail: undefined,
    hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
    position: '8',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
[INFO] GET /api/sales/summary - 500 - 8ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448544540fvefizc8p'
}
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 41ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 41,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  sql: 'SELECT get_sales_summary($1, $2) as summary',
  parameters: [ null, null ]
}
  requestId: '1758448544518tur51s89w'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1264:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  original: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
[INFO] GET /api/sales/summary - 500 - 7ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175844854456517zufrpec'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/customers?limit=10 - 500 - 3ms {
  method: 'GET',
  url: '/api/sales/customers?limit=10',
  statusCode: 500,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448544578n0lyrw0af'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448544781 - 200 - 4ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448544781',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448544657vl5pvjsd8'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448544813 - 200 - 2ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448544813',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485446851pz5nkhao'
}
[INFO] GET /sales/warehouse-release-orders - 200 - 2ms {
  method: 'GET',
  url: '/sales/warehouse-release-orders',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '175844854912148lyv3z91'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 304 - 3ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 304,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485494340tlp387ay'
}
[INFO] GET /assets/TreasuryVouchers-B9tUVCSS.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/TreasuryVouchers-B9tUVCSS.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.195',
  userId: undefined,
  username: undefined,
  requestId: '1758448549547fwmob9fzj'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 5ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448549613vz94xssc5'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
    constraint: undefined,
    file: 'parse_func.c',
    line: '629',
    routine: 'ParseFuncOrColumn',
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  sql: 'SELECT get_sales_summary($1, $2) as summary',
  parameters: [ null, null ]
}
Error fetching customers: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:185:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_customers_list_final(unknown, unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 252,
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
    sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
    parameters: [ 1, 10, null, null ]
  },
  original: error: function get_customers_list_final(unknown, unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 252,
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
    sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
    parameters: [ 1, 10, null, null ]
  },
  sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
  parameters: [ 1, 10, null, null ]
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Notification.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:49.631 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:49.631 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:49.631 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 7ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 7,
}
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448549628liuz8t0e9'
}
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
[INFO] GET /api/settings - 200 - 16ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 16,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448549630ejafbvtr2'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/sales/summary - 500 - 9ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 9,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448549658e0wkfzikl'
}
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
[INFO] GET /api/financial/summary - 200 - 24ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 24,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485496451boohvgew'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1264:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  original: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  sql: 'SELECT get_sales_summary($1, $2) as summary',
  parameters: [ null, null ]
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
[INFO] GET /api/financial/vouchers/receipts?limit=50 - 500 - 6ms {
  method: 'GET',
  url: '/api/financial/vouchers/receipts?limit=50',
  statusCode: 500,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485497470ax9um0lh'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448549971 - 200 - 4ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448549971',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448549840z740w7zol'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448550004 - 200 - 3ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448550004',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448549875eesrv7tzl'
}
[INFO] GET /sales/invoice-management - 200 - 1ms {
  method: 'GET',
  url: '/sales/invoice-management',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485577209y8vfhei8'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/auth/verify - 304 - 2ms {
  method: 'GET',
  url: '/api/auth/verify',
  statusCode: 304,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485580177dfjt06n6'
}
[INFO] GET /assets/InvoiceManagementUnified-Da9zOkYD.js - 200 - 1ms {
  method: 'GET',
  url: '/assets/InvoiceManagementUnified-Da9zOkYD.js',
  statusCode: 200,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485581445ycy06gmn'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 4ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485583577z0oknqeu'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/settings - 200 - 4ms {
  method: 'GET',
  url: '/api/settings',
  statusCode: 200,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485583662hrs832ct'
}
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 5ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485583692hv9lvmqr'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
🔍 بدء حساب الملخص المالي الحقيقي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
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
  sql: 'SELECT COUNT(*) as count\n' +
    '      FROM receipts r\n' +
    '      WHERE r."isActive" = true',
  parameters: []
}
Error fetching notifications: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Notification.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Notification.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:58.371 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
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
    sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:58.371 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Notification"."id", "Notification"."title", "Notification"."message", "Notification"."type", "Notification"."priority", "Notification"."category", "Notification"."userId", "Notification"."read", "Notification"."readAt", "Notification"."actionUrl", "Notification"."actionLabel", "Notification"."metadata", "Notification"."expiresAt", "Notification"."isActive", "Notification"."createdAt", "Notification"."updatedAt", "user"."id" AS "user.id", "user"."username" AS "user.username", "user"."name" AS "user.name" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:55:58.371 +00:00')) AND "Notification"."isActive" = true ORDER BY "Notification"."read" ASC, "Notification"."priority" DESC, "Notification"."createdAt" DESC LIMIT 20 OFFSET 0;`,
  parameters: {}
}
Error fetching sales summary: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:1264:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  original: error: function get_sales_summary(unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 227,
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
    sql: 'SELECT get_sales_summary($1, $2) as summary',
    parameters: [ null, null ]
  },
  sql: 'SELECT get_sales_summary($1, $2) as summary',
  parameters: [ null, null ]
}
[INFO] GET /api/sales/summary - 500 - 4ms {
  method: 'GET',
  url: '/api/sales/summary',
  statusCode: 500,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448558392nsmm3iv6x'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم حساب الملخص المالي الحقيقي بنجاح
📊 إجمالي الأصول: 0 LYD
📊 إجمالي الالتزامات: 0 LYD
📊 صافي الربح: 0 LYD
Error fetching invoices: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.select (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Invoice.findAll (/app/server/node_modules/sequelize/lib/model.js:1140:21)
    at async file:///app/server/src/routes/sales.js:503:22 {
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
[INFO] GET /api/financial/summary - 200 - 23ms {
  method: 'GET',
  url: '/api/financial/summary',
  statusCode: 200,
  responseTime: 23,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485583901mrdi1cyx'
}
[INFO] GET /api/sales/invoices?page=1&limit=10 - 500 - 8ms {
  method: 'GET',
  url: '/api/sales/invoices?page=1&limit=10',
  statusCode: 500,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
    routine: 'errorMissingColumn',
    sql: 'SELECT "Invoice"."id", "Invoice"."invoiceNumber", "Invoice"."customerId", "Invoice"."date", "Invoice"."dueDate", "Invoice"."subtotal", "Invoice"."taxAmount", "Invoice"."total", "Invoice"."paidAmount", "Invoice"."status", "Invoice"."outstandingAmount", "Invoice"."accountId", "Invoice"."currency", "Invoice"."exchangeRate", "Invoice"."createdBy", "Invoice"."notes", "Invoice"."createdAt", "Invoice"."updatedAt", "customer"."id" AS "customer.id", "customer"."code" AS "customer.code", "customer"."name" AS "customer.name", "customer"."type" AS "customer.type" FROM "invoices" AS "Invoice" LEFT OUTER JOIN "customers" AS "customer" ON "Invoice"."customerId" = "customer"."id" ORDER BY "Invoice"."date" DESC LIMIT 10 OFFSET 0;',
    parameters: undefined
  },
  sql: 'SELECT "Invoice"."id", "Invoice"."invoiceNumber", "Invoice"."customerId", "Invoice"."date", "Invoice"."dueDate", "Invoice"."subtotal", "Invoice"."taxAmount", "Invoice"."total", "Invoice"."paidAmount", "Invoice"."status", "Invoice"."outstandingAmount", "Invoice"."accountId", "Invoice"."currency", "Invoice"."exchangeRate", "Invoice"."createdBy", "Invoice"."notes", "Invoice"."createdAt", "Invoice"."updatedAt", "customer"."id" AS "customer.id", "customer"."code" AS "customer.code", "customer"."name" AS "customer.name", "customer"."type" AS "customer.type" FROM "invoices" AS "Invoice" LEFT OUTER JOIN "customers" AS "customer" ON "Invoice"."customerId" = "customer"."id" ORDER BY "Invoice"."date" DESC LIMIT 10 OFFSET 0;',
  parameters: {}
}
  userId: 1,
  username: 'admin',
  requestId: '17584485584066ktxw5qru'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
✅ تم العثور على مستخدم admin: admin (1)
Error fetching shipping invoices: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async PostgresQueryInterface.rawSelect (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:434:18)
    at async ShippingInvoice.aggregate (/app/server/node_modules/sequelize/lib/model.js:1277:19)
    at async ShippingInvoice.count (/app/server/node_modules/sequelize/lib/model.js:1306:20)
    at async Promise.all (index 0)
    at async ShippingInvoice.findAndCountAll (/app/server/node_modules/sequelize/lib/model.js:1322:27)
    at async file:///app/server/src/routes/sales.js:2586:39 {
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
Error fetching customers: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///app/server/src/routes/sales.js:185:20 {
  name: 'SequelizeDatabaseError',
  parent: error: function get_customers_list_final(unknown, unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
[INFO] GET /api/sales/customers?page=1&limit=100 - 500 - 8ms {
  method: 'GET',
  url: '/api/sales/customers?page=1&limit=100',
  statusCode: 500,
  responseTime: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448558419hv4bekbyn'
}
[INFO] GET /api/sales/shipping-invoices?page=1&limit=10 - 500 - 7ms {
  method: 'GET',
  url: '/api/sales/shipping-invoices?page=1&limit=10',
  statusCode: 500,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448558418vooe1h0gy'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448558625 - 200 - 2ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448558625',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '1758448558486qq2jb6zr4'
}
📁 Current logo request
✅ Current logo found: logo-1758303047268-17121842.PNG
[INFO] GET /api/settings/logo?t=1758448558652 - 200 - 2ms {
  method: 'GET',
  url: '/api/settings/logo?t=1758448558652',
  statusCode: 200,
  responseTime: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485585045cvn47val'
}
[INFO] GET /logo.png - 304 - 0ms {
  method: 'GET',
  url: '/logo.png',
  statusCode: 304,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.148',
  userId: undefined,
  username: undefined,
  requestId: '17584485834689hczqxyc4'
}
[INFO] GET /assets/AdminDashboard-CN4h98ev.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/AdminDashboard-CN4h98ev.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485837420hgoemjb9'
}
[INFO] GET /assets/minus-FoHOd1Y3.js - 304 - 0ms {
  method: 'GET',
  url: '/assets/minus-FoHOd1Y3.js',
  statusCode: 304,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: undefined,
  username: undefined,
  requestId: '17584485837461wrfdds9v'
}
[INFO] GET /assets/trending-down-B_beGuxu.js - 304 - 1ms {
  method: 'GET',
  url: '/assets/trending-down-B_beGuxu.js',
  statusCode: 304,
  responseTime: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.189',
  userId: undefined,
  username: undefined,
  requestId: '1758448583760r0osyvfj1'
}
[INFO] GET /assets/credit-card-Bx5_iLpD.js - 304 - 0ms {
  method: 'GET',
  url: '/assets/credit-card-Bx5_iLpD.js',
  statusCode: 304,
  responseTime: 0,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.178',
  userId: undefined,
  username: undefined,
  requestId: '17584485837819file4i80'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/users - 304 - 4ms {
  method: 'GET',
  url: '/api/admin/users',
  statusCode: 304,
  responseTime: 4,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485839206s1iv3243'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/roles - 304 - 5ms {
  method: 'GET',
  url: '/api/admin/roles',
  statusCode: 304,
  responseTime: 5,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448583929781aco8fa'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/system-stats - 200 - 3ms {
  method: 'GET',
  url: '/api/admin/system-stats',
  statusCode: 200,
  responseTime: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584485839393ficrbmx1'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/admin/overview - 200 - 25ms {
  method: 'GET',
  url: '/api/admin/overview',
  statusCode: 200,
  responseTime: 25,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448583947jiz534bw8'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 252,
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
    sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
    parameters: [ 1, 100, null, null ]
  },
  original: error: function get_customers_list_final(unknown, unknown, unknown, unknown) does not exist
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 252,
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
    sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
    parameters: [ 1, 100, null, null ]
  },
  sql: 'SELECT get_customers_list_final($1, $2, $3, $4) as result',
  parameters: [ 1, 100, null, null ]
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:56:45.654 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  original: error: operator does not exist: uuid = integer
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 12ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 12,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448605646klow5gjvv'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] POST /api/admin/users - 500 - 318ms {
  method: 'POST',
  url: '/api/admin/users',
  statusCode: 500,
  responseTime: 318,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175844862804570zwg1rm1'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:56:45.654 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:56:45.654 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error creating user: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at async PostgresQueryInterface.insert (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:308:21)
    at async model.save (/app/server/node_modules/sequelize/lib/model.js:2490:35)
    at async User.create (/app/server/node_modules/sequelize/lib/model.js:1362:12)
    at async file:///app/server/src/routes/admin.js:101:18 {
  name: 'SequelizeDatabaseError',
  parent: error: invalid input syntax for type integer: "d0a4542a-9c7c-4003-97d2-81002ed55e15"
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 179,
    severity: 'ERROR',
    code: '22P02',
    detail: undefined,
    hint: undefined,
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: "unnamed portal parameter $1 = '...'",
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'numutils.c',
    line: '616',
    routine: 'pg_strtoint32_safe',
    sql: 'INSERT INTO "users" ("id","username","password","name","email","role","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "id","username","password","name","email","role","isActive","lastLoginAt","passwordChangedAt","createdAt","updatedAt";',
    parameters: [
      'd0a4542a-9c7c-4003-97d2-81002ed55e15',
      'admin2',
      '$2a$12$hCIJaZBx2L2XwHX59sNq9.R5jIiSTos5popRxZGH0arOXPoBB9yPq',
      'af',
      'f@gmail.com',
      'admin',
      true,
      '2025-09-21 09:57:08.055 +00:00',
      '2025-09-21 09:57:08.055 +00:00'
    ]
  },
  original: error: invalid input syntax for type integer: "d0a4542a-9c7c-4003-97d2-81002ed55e15"
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 179,
    severity: 'ERROR',
    code: '22P02',
    detail: undefined,
    hint: undefined,
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: "unnamed portal parameter $1 = '...'",
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'numutils.c',
    line: '616',
    routine: 'pg_strtoint32_safe',
    sql: 'INSERT INTO "users" ("id","username","password","name","email","role","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "id","username","password","name","email","role","isActive","lastLoginAt","passwordChangedAt","createdAt","updatedAt";',
    parameters: [
      'd0a4542a-9c7c-4003-97d2-81002ed55e15',
      'admin2',
      '$2a$12$hCIJaZBx2L2XwHX59sNq9.R5jIiSTos5popRxZGH0arOXPoBB9yPq',
      'af',
      'f@gmail.com',
      'admin',
      true,
      '2025-09-21 09:57:08.055 +00:00',
      '2025-09-21 09:57:08.055 +00:00'
    ]
  },
  sql: 'INSERT INTO "users" ("id","username","password","name","email","role","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "id","username","password","name","email","role","isActive","lastLoginAt","passwordChangedAt","createdAt","updatedAt";',
  parameters: [
    'd0a4542a-9c7c-4003-97d2-81002ed55e15',
    'admin2',
    '$2a$12$hCIJaZBx2L2XwHX59sNq9.R5jIiSTos5popRxZGH0arOXPoBB9yPq',
    'af',
    'f@gmail.com',
    'admin',
    true,
    '2025-09-21 09:57:08.055 +00:00',
    '2025-09-21 09:57:08.055 +00:00'
  ]
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 200 - 7ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 200,
  responseTime: 7,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175844863570436quvaztz'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:57:15.707 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:57:15.707 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:57:15.707 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
Error creating user: Error
    at Query.run (/app/server/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /app/server/node_modules/sequelize/lib/sequelize.js:315:28
    at async PostgresQueryInterface.insert (/app/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:308:21)
    at async model.save (/app/server/node_modules/sequelize/lib/model.js:2490:35)
    at async User.create (/app/server/node_modules/sequelize/lib/model.js:1362:12)
    at async file:///app/server/src/routes/admin.js:101:18 {
  name: 'SequelizeDatabaseError',
  parent: error: invalid input syntax for type integer: "0f006f97-c328-44e2-96bc-7bab84b94dfe"
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 179,
    severity: 'ERROR',
    code: '22P02',
    detail: undefined,
    hint: undefined,
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: "unnamed portal parameter $1 = '...'",
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'numutils.c',
    line: '616',
[INFO] POST /api/admin/users - 500 - 298ms {
  method: 'POST',
  url: '/api/admin/users',
  statusCode: 500,
  responseTime: 298,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584486514329nogagsg0'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
    routine: 'pg_strtoint32_safe',
    sql: 'INSERT INTO "users" ("id","username","password","name","email","role","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "id","username","password","name","email","role","isActive","lastLoginAt","passwordChangedAt","createdAt","updatedAt";',
    parameters: [
      '0f006f97-c328-44e2-96bc-7bab84b94dfe',
      'admin2',
      '$2a$12$dv0dSxopZN6Z.124OzhGi.HdSQm7UPGF5HeybvwEkQhGA/TBAcy9G',
      'af',
      'f@gmail.com',
      'admin',
      true,
      '2025-09-21 09:57:31.436 +00:00',
      '2025-09-21 09:57:31.436 +00:00'
    ]
  },
  original: error: invalid input syntax for type integer: "0f006f97-c328-44e2-96bc-7bab84b94dfe"
      at Parser.parseErrorMessage (/app/server/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/app/server/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/app/server/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/app/server/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10)
      at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
    length: 179,
    severity: 'ERROR',
    code: '22P02',
    detail: undefined,
    hint: undefined,
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: "unnamed portal parameter $1 = '...'",
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'numutils.c',
    line: '616',
    routine: 'pg_strtoint32_safe',
    sql: 'INSERT INTO "users" ("id","username","password","name","email","role","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "id","username","password","name","email","role","isActive","lastLoginAt","passwordChangedAt","createdAt","updatedAt";',
    parameters: [
      '0f006f97-c328-44e2-96bc-7bab84b94dfe',
      'admin2',
      '$2a$12$dv0dSxopZN6Z.124OzhGi.HdSQm7UPGF5HeybvwEkQhGA/TBAcy9G',
      'af',
      'f@gmail.com',
      'admin',
      true,
      '2025-09-21 09:57:31.436 +00:00',
      '2025-09-21 09:57:31.436 +00:00'
    ]
  },
  sql: 'INSERT INTO "users" ("id","username","password","name","email","role","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "id","username","password","name","email","role","isActive","lastLoginAt","passwordChangedAt","createdAt","updatedAt";',
  parameters: [
    '0f006f97-c328-44e2-96bc-7bab84b94dfe',
    'admin2',
    '$2a$12$dv0dSxopZN6Z.124OzhGi.HdSQm7UPGF5HeybvwEkQhGA/TBAcy9G',
    'af',
    'f@gmail.com',
    'admin',
    true,
    '2025-09-21 09:57:31.436 +00:00',
    '2025-09-21 09:57:31.436 +00:00'
  ]
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 10ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 10,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175844866563470n4demm9'
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:57:45.639 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:57:45.639 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:57:45.639 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
}
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 13ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 13,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '1758448695646hhtk18ktd'
}
[INFO] System metrics {
  metrics: {
    uptime: 300058,
    requests: 127,
    errors: 0,
    errorRate: 0,
    averageResponseTime: 13,
    activeConnections: 0,
    memory: {
      rss: 104431616,
      heapTotal: 37642240,
      heapUsed: 35227704,
      external: 3749006,
      arrayBuffers: 435308
    },
    cpu: { user: 2149975, system: 334302 },
    system: {
      platform: 'linux',
      arch: 'x64',
      nodeVersion: 'v18.20.5',
      totalMemory: 8326750208,
      freeMemory: 6713212928,
      loadAverage: [Array],
      uptime: 900990.47
    }
  }
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
✅ تم العثور على مستخدم admin: admin (1)
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 6ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 6,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '17584487256575o3uff33s'
}
⚠️ JWT token يحتوي على userId integer: 1, البحث عن مستخدم admin افتراضي...
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:58:15.654 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:58:15.654 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:58:15.654 +00:00')) AND "Notification"."isActive" = true;`,
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:58:45.661 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:58:45.661 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:58:45.661 +00:00')) AND "Notification"."isActive" = true;`,
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
    at async Notification.getUserNotifications (file:///app/server/src/models/Notification.js:214:12)
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:59:15.686 +00:00')) AND "Notification"."isActive" = true;`,
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
    sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:59:15.686 +00:00')) AND "Notification"."isActive" = true;`,
    parameters: undefined
  },
  sql: `SELECT count("Notification"."id") AS "count" FROM "notifications" AS "Notification" LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" WHERE (("Notification"."userId" = 1 OR "Notification"."userId" IS NULL) AND ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > '2025-09-21 09:59:15.686 +00:00')) AND "Notification"."isActive" = true;`,
  parameters: {}
[INFO] GET /api/notifications?limit=20&unreadOnly=false - 304 - 25ms {
  method: 'GET',
  url: '/api/notifications?limit=20&unreadOnly=false',
  statusCode: 304,
  responseTime: 25,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ip: '172.69.211.183',
  userId: 1,
  username: 'admin',
  requestId: '175844875567554oz2rv39'
}
}