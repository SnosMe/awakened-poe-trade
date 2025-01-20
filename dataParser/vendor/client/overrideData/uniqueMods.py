import json
import os
import pprint
import re


def get_file(file_name: str):
    return f"{os.path.dirname(os.path.realpath(__file__))}/{file_name}"


# File to store the UNIQUE_MOD_LOOKUP
DATA_FILE = get_file("unique_override_data_by_item.json")


# Load the UNIQUE_MOD_LOOKUP from the file or initialize a new one
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r") as file:
        UNIQUE_MOD_LOOKUP = json.load(file)
else:
    UNIQUE_MOD_LOOKUP = {}

# UNIQUE_ITEM_LIST = {}


def parse_unique_input_by_mods(input_text):
    lines = input_text.strip().split("\n")
    if len(lines) < 2:
        print("Invalid input format.")
        return

    item_name = lines[0].strip()
    check_dict = {}
    for line in lines[1:]:
        # Match cases with ranges or one number without parentheses
        matches = re.findall(
            r"\((\d+)\u2013(\d+)\)|(?<!\()\b(\d+)\b to \((\d+)\u2013(\d+)\)|\((\d+)\u2013(\d+)\) to \b(\d+)\b",
            line,
        )
        if not matches:
            continue

        # Replace all ranges with placeholders and strip the line
        stat_key = re.sub(r"\+?\(.*?\)|\b\d+\b", "#", line).strip()

        ranges = []
        for match in matches:
            if match[0] and match[1]:  # Case: (x–y)
                ranges.append([int(match[0]), int(match[1])])
            elif match[2] and match[3] and match[4]:  # Case: x to (y–z)
                ranges.append([int(match[2]), int(match[2])])  # Single value for x
                ranges.append([int(match[3]), int(match[4])])  # Range for (y–z)
            elif match[5] and match[6] and match[7]:  # Case: (x–y) to z
                ranges.append([int(match[5]), int(match[6])])  # Range for (x–y)
                ranges.append([int(match[7]), int(match[7])])  # Single value for z

        # Add to UNIQUE_MOD_LOOKUP
        if stat_key not in UNIQUE_MOD_LOOKUP:
            UNIQUE_MOD_LOOKUP[stat_key] = {}
        UNIQUE_MOD_LOOKUP[stat_key][item_name] = ranges
        check_dict[stat_key] = {}
        check_dict[stat_key][item_name] = ranges
    pprint.pprint(check_dict)


def parse_unique_input_by_item(input_text, in_name: str | None = None):
    lines = input_text.strip().split("\n")
    if len(lines) < 2:
        print("Invalid input format.")
        return

    if in_name is not None:
        item_name = in_name
    else:
        item_name = lines[0].strip()

    if item_name is None or item_name == "":
        print("Invalid input format.")
        return

    item_out = {}
    for line in lines[1:]:
        # Match cases with ranges or one number without parentheses
        matches = re.findall(
            r"\((-?\d+)\u2013(-?\d+)\)|(?<!\()\b(-?\d+)\b to \((-?\d+)\u2013(-?\d+)\)|\((-?\d+)\u2013(-?\d+)\) to \b(-?\d+)\b",
            line,
        )
        if not matches:
            continue
        stat_key = re.sub(r"\+?\(.*?\)|\b\d+\b", "#", line).strip()

        ranges = []
        for match in matches:
            if match[0] and match[1]:  # Case: (x–y)
                ranges.append([int(match[0]), int(match[1])])
            elif match[2] and match[3] and match[4]:  # Case: x to (y–z)
                ranges.append([int(match[2]), int(match[2])])  # Single value for x
                ranges.append([int(match[3]), int(match[4])])  # Range for (y–z)
            elif match[5] and match[6] and match[7]:  # Case: (x–y) to z
                ranges.append([int(match[5]), int(match[6])])  # Range for (x–y)
                ranges.append([int(match[7]), int(match[7])])  # Single value for z

        if stat_key in item_out:
            imp_str = f"(implicit) {stat_key}"
            item_out[imp_str] = item_out[stat_key]

        item_out[stat_key] = ranges

    return (item_name, item_out)


def save_item_data(data: dict, out_file: str = DATA_FILE):
    with open(out_file, "w") as file:
        json.dump(data, file, indent=2)


def save_data(data: dict, out_file: str = DATA_FILE):
    with open(out_file, "w") as file:
        json.dump(data, file, indent=2)


def run(lang: str = "en"):
    with open(get_file("data.txt"), "r", encoding="utf-8") as file:
        item_texts = file.read().split("\n\n\n")

    out_data = {}
    for item_text in item_texts:
        item_name, item_data = parse_unique_input_by_item(item_text)
        if item_name is None:
            continue
        out_data[item_name] = item_data

    save_data(out_data, get_file("unique_override_data_by_item.json"))


if __name__ == "__main__":
    # literally just copying from https://poe2db.tw/us/Unique_item
    # input_text = """

    # """

    # input_text_list = input_text.split("\n\n")
    # for item in input_text_list:
    #     parse_unique_input_by_item(item)
    # # pprint.pprint(UNIQUE_MOD_LOOKUP)
    # if input("Save data? (y/n) ") == "y":
    #     save_item_data()

    run()
