import json
import os


def get_script_dir():
    """Returns the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__))


# List of localization codes
localizations = ["en", "ru", "ko", "cmn-Hant"]

key_to_find = "trade.ids.pseudo"  # The specific key path to check for


def has_nested_key(obj, key_path):
    keys = key_path.split(".")
    for key in keys:
        if isinstance(obj, dict) and key in obj:
            obj = obj[key]
        else:
            return False
    return True


def process_file(input_file_path, output_file_path):
    result_list = []

    # Use 'utf-8' encoding when opening the input file
    with open(input_file_path, "r", encoding="utf-8") as input_file:
        for line in input_file:
            try:
                json_object = json.loads(line)
                if has_nested_key(json_object, key_to_find):
                    result_list.append(json_object)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON: {e}")

    with open(output_file_path, "w", encoding="utf-8") as output_file:
        for item in result_list:
            output_file.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(
        f"Processing complete for {input_file_path}. Check {output_file_path} for results."
    )


if __name__ == "__main__":
    for loc in localizations:
        input_file_path = f"{get_script_dir()}/../../data/{loc}/stats.ndjson.old"  # Path to the input file
        output_file_path = (
            f"{get_script_dir()}/{loc}/all-pseudo.ndjson"  # Path to the output file
        )
        process_file(input_file_path, output_file_path)
