#!/bin/bash

cd /app/bot && npm start &
cd /app/web && npm start &

wait
