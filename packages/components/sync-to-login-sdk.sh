#!/bin/bash

echo "Building components..."
bun run build

echo "Copying files to login-sdk..."
cp dist/per-component/unidy-newsletter.js ../login-sdk/www/
cp dist/per-component/index.js ../login-sdk/www/

echo "✅ Newsletter component files synced to login-sdk!"




