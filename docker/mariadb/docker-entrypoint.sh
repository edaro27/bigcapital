#!/usr/bin/env sh
set -eu

for required_name in MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE TENANT_DB_NAME_PERFIX; do
  eval "required_value=\${$required_name:-}"
  if [ -z "$required_value" ]; then
    echo "Missing required database setting: $required_name" >&2
    exit 1
  fi
done

case "$MYSQL_USER:$MYSQL_DATABASE:$TENANT_DB_NAME_PERFIX" in
  *[!A-Za-z0-9_:]* )
    echo 'Database user, name, and tenant prefix may contain only letters, numbers, and underscores' >&2
    exit 1
    ;;
esac
case "$MYSQL_PASSWORD" in
  *[!A-Za-z0-9]* | ???????? | ??????? | ?????? | ????? | ???? | ??? | ?? | ? )
    echo 'MYSQL_PASSWORD must be at least 9 alphanumeric characters' >&2
    exit 1
    ;;
esac

system_db_grant_pattern=$(printf '%s' "$MYSQL_DATABASE" | sed 's/_/\\_/g; s/%/\\%/g')
system_db_grant_replacement=$(printf '%s' "$system_db_grant_pattern" | sed 's/[&|\\]/\\&/g')
tenant_grant_pattern=$(printf '%s' "$TENANT_DB_NAME_PERFIX" | sed 's/_/\\_/g; s/%/\\%/g')
tenant_grant_pattern="${tenant_grant_pattern}%"
tenant_grant_replacement=$(printf '%s' "$tenant_grant_pattern" | sed 's/[&|\\]/\\&/g')

cp /scripts/init.template.sql /scripts/init.sql
sed -i "s|{MYSQL_USER}|$MYSQL_USER|g" /scripts/init.sql
sed -i "s|{MYSQL_PASSWORD}|$MYSQL_PASSWORD|g" /scripts/init.sql
sed -i "s|{MYSQL_DATABASE}|$MYSQL_DATABASE|g" /scripts/init.sql
sed -i "s|{SYSTEM_DB_GRANT_PATTERN}|$system_db_grant_replacement|g" /scripts/init.sql
sed -i "s|{TENANT_DB_GRANT_PATTERN}|$tenant_grant_replacement|g" /scripts/init.sql

mariadb --protocol=socket -u root -p"$MYSQL_ROOT_PASSWORD" < /scripts/init.sql
