#!/bin/bash

# Build data
python ./vendor/client/parserRunner.py

# Copy to data folder
sh copy-py-ndjson.sh

# Add pseudo mods
python ./vendor/pseudo-stats/add-to-new.py

# Add images
python ./data/imageFix.py

# Push ndjson to main data folder
sh push-ndjson.sh