# UNIQUE_MOD_LOOKUP = {
#     "Adds # to # Physical Damage": {
#         # Adds (3–5) to (7–10) Physical Damage
#         "Redbeak": [[3, 5], [7, 10]],
#         # Adds (4–6) to (7–10) Physical Damage
#         "Bluetongue": [[4, 6], [7, 10]],
#         # Adds (3–4) to (6–8) Physical Damage
#         "Brynhand's Mark": [[3, 4], [6, 8]],
#         # Adds (2–3) to (4–5) Physical Damage
#         "Wylund's Stake": [[2, 3], [4, 5]],
#         # Adds (4–6) to (8–12) Physical Damage
#         "Frostbreath": [[4, 6], [8, 12]],
#         # Adds (10–12) to (18–22) Physical Damage
#         "Trenchtimbre": [[10, 12], [18, 22]],
#         # Adds (7–10) to (12–18) Physical Damage
#         "Trephina": [[7, 10], [12, 18]],
#     },
#     "#% increased Physical Damage": {
#         # (100–150)% increased Physical Damage
#         "Hoghunt": [[100, 150]],
#         # (60–80)% increased Physical Damage
#         "Hrimnor's Hymn": [[60, 80]],
#     },
#     "+# to Accuracy Rating": {
#         # +(30–50) to Accuracy Rating
#         "Brynhand's Mark": [[30, 50]],
#         # +(300–400) to Accuracy Rating
#         "Olrovasara": [[300, 400]],
#     },
#     "+# to Strength": {
#         # +(5–10) to Strength
#         "Brynhand's Mark": [[5, 10]],
#     },
#     "Adds # to # Fire Damage": {
#         # Adds (2–3) to (4–5) Fire Damage
#         "Wylund's Stake": [[2, 3], [4, 5]],
#         # +(10–15) to Strength
#         "Hrimnor's Hymn": [[10, 15]],
#     },
#     "Adds # to # Cold Damage": {
#         # Adds (4–6) to (8–12) Cold Damage
#         "Frostbreath": [[4, 6], [8, 12]],
#         # Adds (9–12) to (18–22) Cold Damage
#         "Seeing Stars": [[9, 12], [18, 22]],
#     },
#     "Adds # to # Lightning Damage": {
#         # Adds 1 to (30–35) Lightning Damage
#         "Seeing Stars": [[1, 1], [30, 35]],
#         # Adds 1 to (60–80) Lightning Damage
#         "Olrovasara": [[1, 1], [60, 80]],
#     },
#     "Hits Break # Armour": {
#         # Hits Break (30–50) Armour
#         "Wylund's Stake": [[30, 50]],
#     },
#     "#% increased Attack Speed": {
#         # (20–30)% increased Attack Speed
#         "Trenchtimbre": [[20, 30]],
#         # (10–20)% increased Attack Speed
#         "Seeing Stars": [[10, 20]],
#         # (5–30)% increased Attack Speed
#         "Olrovasara": [[5, 30]],
#         # (10–15)% increased Attack Speed
#         "Trephina": [[10, 15]],
#     },
#     "+# to Level of all Minion Skills": {
#         # +(1–3) to Level of all Minion Skills
#         "Trenchtimbre": [[1, 3]],
#     },
#     "Causes #% increased Stun Buildup": {
#         # Causes (30–50)% increased Stun Buildup
#         "Hrimnor's Hymn": [[30, 50]],
#         # Causes (30–50)% increased Stun Buildup
#         "Trephina": [[30, 50]],
#     },
#     "Gain # Life per Enemy Killed": {
#         # Gain (10–20) Life per Enemy Killed
#         "Hrimnor's Hymn": [[10, 20]],
#     },
# }
import json
import os
import pprint
import re

# File to store the UNIQUE_MOD_LOOKUP
DATA_FILE = f"{os.path.dirname(os.path.realpath(__file__))}/unique_override_data.json"

# Load the UNIQUE_MOD_LOOKUP from the file or initialize a new one
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r") as file:
        UNIQUE_MOD_LOOKUP = json.load(file)
else:
    UNIQUE_MOD_LOOKUP = {}


def parse_item_input(input_text):
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
        stat_key = re.sub(r"\(.*?\)|\b\d+\b", "#", line).strip()

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


def save_data():
    with open(DATA_FILE, "w") as file:
        json.dump(UNIQUE_MOD_LOOKUP, file, indent=4)


if __name__ == "__main__":
    input_text = """
Guiding Palm
Grants Skill: Purity of Fire
Allies in your Presence deal (4–6) to (7–10) additional Attack Fire Damage
+(5–10) to all Attributes
25% increased Light Radius
50% of your Life Regeneration is granted to Allies in your Presence
    """

    input_text_list = []
    for item in input_text_list:
        parse_item_input(item)
    # pprint.pprint(UNIQUE_MOD_LOOKUP)
    if input("Save data? (y/n) ") == "y":
        save_data()
