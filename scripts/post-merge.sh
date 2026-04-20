#!/bin/bash
set -e

# Install root dependencies (web + server)
npm install --prefer-offline

# Install mobile dependencies
cd mobile && npm install --prefer-offline && cd ..
