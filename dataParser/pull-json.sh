#!/bin/bash

# Array of language codes and their corresponding base URLs
declare -A lang_urls=(
    ["en"]="https://www.pathofexile.com"
    ["ru"]="https://ru.pathofexile.com"
    ["ko"]="https://poe.game.daum.net"
    ["cmn-Hant"]="https://pathofexile.tw"
    ["ja"]="https://jp.pathofexile.com"
    ["de"]="https://de.pathofexile.com"
)

# URLs to fetch JSON from (relative paths)
urls=(
    "/api/trade2/data/filters"
    "/api/trade2/data/stats"
    "/api/trade2/data/items"
    "/api/trade2/data/static"
)

# Loop through each language
for lang in "${!lang_urls[@]}"; do
    # Directory to save the JSON files for the current language
    output_dir="./vendor/json-api/$lang"
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"

    # Loop through each URL
    for relative_url in "${urls[@]}"; do
        # Construct the full URL
        url="${lang_urls[$lang]}$relative_url"
        
        # Extract the filename from the relative URL
        filename=$(basename "$relative_url")

        echo "Fetching JSON from: $url for language: $lang"
        
        # Fetch the JSON data and save it to a file
        curl -s "$url" -o "$output_dir/$filename.json"
        
        if [ $? -eq 0 ]; then
            echo "Saved JSON to: $output_dir/$filename.json"
        else
            echo "Failed to fetch JSON from: $url"
        fi
    done
done