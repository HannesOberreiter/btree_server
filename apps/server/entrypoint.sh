sleep 5
if [ "${IS_CHILD:-false}" != "true" ]; then
  pnpm run migrate
fi
node dist/app.bootstrap.js