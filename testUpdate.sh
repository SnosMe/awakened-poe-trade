#!/bin/bash

# Remove ./renderer/dist if it exists
rm -rf ./renderer/dist

# Remove ./main/dist if it exists
rm -rf ./main/dist

cd ./renderer

npm install
npm run make-index-files
npm run build
cd ..

cd ./main

npm install
npm run build
npm run package


