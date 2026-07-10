#!/bin/bash

cd nodejs
npm install
cd ..
rm -f layer.zip
zip -r layer.zip nodejs
echo "Layer package created: layer.zip"