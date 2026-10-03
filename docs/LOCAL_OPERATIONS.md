# Local BigCapital operations

The development and production databases are intentionally separate. Use the
commands below so only one environment is active at a time.

## Start and pause

- `npm run env:dev:start` starts the development infrastructure and pauses
  production.
- `npm run env:prod:start` starts production (including PDF generation) and
  pauses development.
- `npm run env:pause` pauses all BigCapital Docker containers.
- `npm run env:status` shows both environments.

The development web and server processes still run from their existing
`dev:webapp` and `dev:server` commands. For development PDF generation, start
the server with `GOTENBERG_URL=http://127.0.0.1:9000` and
`GOTENBERG_DOCS_URL=http://host.docker.internal:3000/public/`.

## Development email

Development email is captured locally by Mailpit and is never delivered to a
real recipient. Its web inbox is available at <http://127.0.0.1:8025>. The
development server uses the following SMTP settings in its ignored
`packages/server/.env` file:

- host `127.0.0.1`
- port `1025`
- no username or password
- TLS disabled

Mailpit belongs only to `docker-compose.yml`; it is not part of the production
Compose environment.

## Production backup

- `npm run backup:prod` creates a private, compressed backup under
  `backups/production/`. The directory is excluded from Git.
- `npm run backup:verify` restores the newest backup into a temporary database,
  verifies that the BigCapital databases are present, and removes the temporary
  container and volume.

The backup command briefly starts or unpauses only the production database when
needed, then returns it to its previous state. Keep an additional encrypted copy
of verified backups on a separate drive or trusted backup service.

## Low-memory production web build

Run `npm run build:prod:webapp`. It compiles the web app on the host, confirms
that the output exists, and packages only the compiled files into the production
web image. This avoids the high-memory dependency install and compile inside
Docker while producing the same Nginx runtime image.
