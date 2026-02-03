#!/bin/bash

cd /app/bot && npm start &
cd /app/web && npx next start -H 0.0.0.0 -p 3000 &

wait
