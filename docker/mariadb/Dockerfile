FROM golang:1.26.6-alpine@sha256:3889b425f035be855a72fb4755265311293b6d414521f0a519d819df32222d83 AS gosu-builder

RUN CGO_ENABLED=0 go install -trimpath github.com/tianon/gosu@6456aaa0f3c854d199d0f037f068eb97515b7513

FROM mariadb:10.11@sha256:8020e05c4c498d06c87f0a1db010eb79bd6f8fb30e9b763d4690c34ce1e61008

USER root
COPY --from=gosu-builder /go/bin/gosu /usr/local/bin/gosu
COPY my.cnf /etc/mysql/conf.d/my.cnf

# Copy init sql file with env vars and then the script will substitute the variables.
COPY ./init.sql /scripts/init.template.sql
COPY ./docker-entrypoint.sh /docker-entrypoint-initdb.d/docker-initialize.sh

# The scripts in the `docker-entrypoint-initdb.d/` directory are executed as
# the mysql user inside the MySQL Docker container.
RUN chown -R mysql:root /docker-entrypoint-initdb.d
RUN chown -R mysql:root /scripts
RUN gosu --version && gosu mysql true

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD mariadb-admin ping --silent --host=localhost --user=root --password="$MYSQL_ROOT_PASSWORD"
