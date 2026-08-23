FROM redis:7.4-alpine@sha256:ff02b58f971e7d7d156a1267e283fcbbeee91773b6aa36c49dac28ecfe28eadf

COPY redis.conf /usr/local/etc/redis/redis.conf

USER redis

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD redis-cli --no-auth-warning -a "$REDIS_PASSWORD" ping | grep -q PONG

CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]
