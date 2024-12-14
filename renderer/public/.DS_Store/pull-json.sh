#!/bin/bash

# URLs to fetch JSON from
urls=(
    "https://www.pathofexile.com/api/trade2/data/filters"
    "https://www.pathofexile.com/api/trade2/data/stats"
    "https://www.pathofexile.com/api/trade2/data/items"
    "https://www.pathofexile.com/api/trade2/data/static"
)

# Directory to save the JSON files
output_dir="./vendor/json-api"

# Create output directory if it doesn't exist
mkdir -p "$output_dir"

# Loop through each URL
for url in "${urls[@]}"; do
    # Extract the filename from the URL
    filename=$(basename "$url")

    echo "Fetching JSON from: $url"
    
    # Fetch the JSON data and save it to a file
    curl -s "$url" -o "$output_dir/$filename.json"
    
    if [ $? -eq 0 ]; then
        echo "Saved JSON to: $output_dir/$filename.json"
    else
        echo "Failed to fetch JSON from: $url"
    fi
done