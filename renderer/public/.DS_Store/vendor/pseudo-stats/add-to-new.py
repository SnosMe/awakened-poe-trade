import json
import os


def get_script_dir():
    """Returns the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__))


# List of localization codes
localizations = ["en", "ru", "ko", "cmn-Hant"]


def process_filtered_pseudo_stats(loc):
    filtered_file_path = f"{get_script_dir()}/{loc}/pseudo_stats.ndjson"
    stats_file_path = f"{get_script_dir()}/../../data/{loc}/stats.ndjson"
    output_file_path = f"{get_script_dir()}/../../data/{loc}/updated_stats.ndjson"

    # Load all stats at the start to avoid repeated loading
    with open(stats_file_path, "r", encoding="utf-8") as stats_file:
        original_stats_lines = [json.loads(line) for line in stats_file]

    updated_lines = []
    matched_keys = set()  # To track keys that have been updated

    with open(filtered_file_path, "r", encoding="utf-8") as filtered_file:
        for line in filtered_file:
            try:
                pseudo_object = json.loads(line)
                # Check for non-pseudo keys
                if "trade" in pseudo_object and "ids" in pseudo_object["trade"]:
                    non_pseudo_found = any(
                        key in pseudo_object["trade"]["ids"]
                        for key in ["explicit", "implicit", "enchant"]
                    )

                    if non_pseudo_found:
                        # Search for the corresponding stat
                        for stats_object in original_stats_lines:
                            # Check if the trade.ids matches with non-pseudo keys
                            for key in ["explicit", "implicit", "enchant"]:
                                if key in pseudo_object["trade"]["ids"]:
                                    value_to_find = pseudo_object["trade"]["ids"][key]
                                    # Ensure stats_object exists and has 'trade' and 'ids' before accessing
                                    if (
                                        stats_object.get("trade") is not None
                                        and stats_object["trade"].get("ids") is not None
                                        and stats_object["trade"]["ids"].get(key)
                                        == value_to_find
                                    ):
                                        # Cut the line and add the pseudo value
                                        new_stats_object = (
                                            stats_object.copy()
                                        )  # Use copy to avoid modifying original
                                        new_stats_object["trade"]["ids"]["pseudo"] = (
                                            pseudo_object["trade"]["ids"].get("pseudo")
                                        )
                                        updated_lines.append(new_stats_object)
                                        matched_keys.add(
                                            json.dumps(stats_object, ensure_ascii=False)
                                        )
                                        break

                    # If not matched, add the pseudo object as is
                    else:
                        updated_lines.append(pseudo_object)
            except json.JSONDecodeError:
                print(f"Error parsing JSON from filtered file: {line}")

    # Write updated lines and remaining original stats to a new stats file
    with open(output_file_path, "w", encoding="utf-8") as output_file:
        # Write new lines at the top
        for updated_line in updated_lines:
            output_file.write(json.dumps(updated_line, ensure_ascii=False) + "\n")

        # Write the original lines that have not been matched
        for original_line in original_stats_lines:
            if json.dumps(original_line, ensure_ascii=False) not in matched_keys:
                output_file.write(json.dumps(original_line, ensure_ascii=False) + "\n")

    print(f"Updated stats written to {output_file_path} for {loc}.")


if __name__ == "__main__":
    for loc in localizations:
        process_filtered_pseudo_stats(loc)
