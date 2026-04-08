#!/bin/bash
export PATH=/opt/homebrew/opt/node@25/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin
cd "$(dirname "$0")/../frontend"
exec npm run dev
