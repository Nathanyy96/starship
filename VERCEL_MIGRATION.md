# Vercel deployment

This deploy keeps the published 1.1 content and existing challenge/reward cycles.
Assets come from this GitHub repository and are copied into `public/` at build
time. Only the explicit public allowlist is published. API requests go to one
Node function; credentials and private player backups must never enter Git.

Required server environment variables:

- DATABASE_URL: existing Neon PostgreSQL connection, preferably pooled.
- NODE_ENV=production; STARSHIP_TEST_REWARDS=false.
- STARSHIP_ADMIN_KEY and STARSHIP_BACKUP_TOKEN: existing private values.
- STARSHIP_B2_KEY_ID, STARSHIP_B2_APPLICATION_KEY, STARSHIP_B2_BUCKET_ID,
  STARSHIP_BACKUP_KEY_HEX: existing private B2 backup settings.

Do not copy Render's STARSHIP_DATA_DIR. Vercel rejects file persistence if the
database connection is missing. Preview environments must use an isolated Neon
branch/database, not the production connection.

Player sessions are stored as hashed tokens in `starship_sessions`, independently
of player JSON. PostgreSQL transactions and a transaction-scoped advisory lock
serialize read/modify/write across function instances and Neon pooled connections.
Successful responses are sent only after commit. Existing Render sessions require
a fresh login on the new origin; account passwords and progress are preserved.

The external hourly backup job should POST to the new origin's
`/api/admin/player-backup`, with the existing Bearer token and JSON body
`{"destination":"b2"}`. A successful response must include `verified:true`.
This verifies upload, download, decryption, and snapshot comparison. A manual
test does not prove a later scheduled run. No keepalive job is needed/requested.

Validation: run `npm test`, `node --test test/b2-player-backup.test.mjs`, and
`node --test test/serverless-postgres.test.mjs` with an explicit
STARSHIP_TEST_DATABASE_URL. The last test creates and removes an isolated schema;
it checks multiple instances, restart, concurrent saves and stale position writes.
Never test gameplay by consuming real player resources.
