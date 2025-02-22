#!/bin/sh
echo "Waiting for database to be ready..."
bun run /app/scripts/wait-for-db.ts
if [ $? -eq 0 ]; then
    echo "Database is ready, starting server..."
    exec bun server.js
else
    echo "Database connection failed"
    exit 1
fi