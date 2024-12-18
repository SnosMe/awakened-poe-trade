import json
import os


def get_script_dir():
    """Returns the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__))


# List of localization codes
localizations = ["en", "ru", "ko", "cmn-Hant"]

# File containing the pseudo keys to filter on
keys_file_path = (
    f"{get_script_dir()}/pseudo_keys.ndjson"  # Path to your ndjson pseudo keys file
)


def load_pseudo_keys():
    pseudo_keys = set()
    with open(keys_file_path, "r", encoding="utf-8") as keys_file:
        for line in keys_file:
            try:
                json_object = json.loads(line)
                # Assume the pseudo keys are stored under the 'trade.ids.pseudo' path
                if (
                    "trade" in json_object
                    and "ids" in json_object["trade"]
                    and "pseudo" in json_object["trade"]["ids"]
                ):
                    for key in json_object["trade"]["ids"]["pseudo"]:
                        pseudo_keys.add(key)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON in keys file: {e}")
    return pseudo_keys


def process_localization_file(input_file_path, output_file_path, pseudo_keys):
    result_list = []

    with open(input_file_path, "r", encoding="utf-8") as input_file:
        for line in input_file:
            try:
                json_object = json.loads(line)
                # Check if 'trade.ids.pseudo' exists
                if has_nested_key(json_object, "trade.ids.pseudo") and any(
                    value in pseudo_keys
                    for value in json_object["trade"]["ids"]["pseudo"]
                ):
                    result_list.append(json_object)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON: {e}")

    with open(output_file_path, "w", encoding="utf-8") as output_file:
        for item in result_list:
            output_file.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(
        f"Processing complete for {input_file_path}. Check {output_file_path} for results."
    )


def has_nested_key(obj, key_path):
    keys = key_path.split(".")
    for key in keys:
        if isinstance(obj, dict) and key in obj:
            obj = obj[key]
        else:
            return False
    return True


if __name__ == "__main__":
    pseudo_keys = load_pseudo_keys()

    for loc in localizations:
        input_file_path = f"{get_script_dir()}/../../data/{loc}/stats.ndjson.old"  # Path to the input file
        output_file_path = (
            f"{get_script_dir()}/{loc}/pseudo_stats.ndjson"  # Path to the output file
        )
        process_localization_file(input_file_path, output_file_path, pseudo_keys)
