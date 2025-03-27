import json
import os

SUPPORTED_LANG = ("en", "ru", "ko", "cmn-Hant", "ja", "de", "es")


def get_script_dir(lang="en"):
    """Returns the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__)) + "/" + lang


def read_ndjson(file_path, encoding="utf-8"):
    """Reads a newline-delimited JSON file and returns a list of parsed JSON objects."""
    with open(file_path, "r", encoding=encoding) as file:
        return [json.loads(line) for line in file]


def read_cache(file_path):
    """Reads a cache file and returns a dictionary of parsed JSON objects."""
    with open(file_path, "r", encoding="utf-8") as file:
        return json.loads(file.read())


def write_ndjson(file_path, data):
    """Writes a list of JSON objects to a newline-delimited JSON file."""
    with open(file_path, "w", encoding="utf-8") as file:
        for item in data:
            file.write(json.dumps(item, ensure_ascii=False) + "\n")


def get_save_name(item: dict[str, str]) -> str:
    return item["namespace"] + "=" + item["name"]


def update_icons(new_items, old_items, api_cache={}):
    """Update icons in new_items if they are missing and present in old_items."""
    old_icons = {
        get_save_name(item): item["icon"] for item in old_items if "icon" in item
    }

    for new_item in new_items:
        lookup_name = get_save_name(new_item)
        if new_item.get("icon") == "%NOT_FOUND%":
            if lookup_name in api_cache and api_cache[lookup_name] != "%NOT_FOUND%":
                new_item["icon"] = api_cache[lookup_name]
            elif lookup_name in old_icons:
                new_item["icon"] = old_icons[lookup_name]

    return new_items


if __name__ == "__main__":
    for lang in SUPPORTED_LANG:
        # Determine the directory this script is in
        script_dir = get_script_dir(lang)

        print(script_dir)

        # Load the old and new items from the respective files in the script's directory
        old_items = read_ndjson(os.path.join(script_dir, "items.ndjson.old"))
        new_items = read_ndjson(os.path.join(script_dir, "items.ndjson"))

        # Load the cache from the cache file in the script's directory
        cache_items = read_cache(
            os.path.join(get_script_dir(lang=""), "itemImageCache.json")
        )

        # Update new_items with icons from old_items where applicable
        updated_new_items = update_icons(new_items, old_items, api_cache=cache_items)

        # Write the updated new items back to the new file or a new file as needed
        write_ndjson(os.path.join(script_dir, "items.ndjson"), updated_new_items)
