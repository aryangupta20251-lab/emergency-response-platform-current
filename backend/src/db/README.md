PostgreSQL connections use the pool in `pool.js`, configured only through `DATABASE_URL`.

Run `npm run db:check` to execute the read-only `SELECT NOW()` connection check. The
database health endpoint uses the same check. Set `DATABASE_URL` in the ignored
`backend/.env` file; never put credentials in source control.

Schema changes are ordered SQL files under `migrations/`, using names such as
`001_description.sql`. Run `npm run db:migrate` to apply unapplied migrations.
Each migration and its history record are applied in a transaction. Keep each
migration focused and review it before applying it.