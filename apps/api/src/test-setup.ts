// Must run before any module that imports config/env.ts (which calls process.exit on missing vars).
process.env['NODE_ENV']                  = 'test'
process.env['SUPABASE_URL']              = 'https://test.supabase.co'
process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key'
process.env['ARENA_ENGINE']              = 'local'
process.env['ARENA_MODE']                = 'ondemand'
process.env['CORS_ORIGIN']               = 'http://localhost:5173'
