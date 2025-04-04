import logging
import os
import re
import uuid
from collections import defaultdict
from pprint import pprint

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def modTierBuilder(mod_data):
    # First flatten out for each stat on the mod
    flat_mods = []
    logger.info("Starting to build mods")
    logger.info(f"Incoming data: {len(mod_data)}")
    for mod in mod_data:
        mod_index = mod.get("_index")
        if mod_index is None:
            continue
        mod_unique_id = mod.get("Id")
        mod_type = mod.get("ModType")
        mod_level = mod.get("Level")
        mod_domain = mod.get("Domain")
        mod_name = mod.get("Name")
        mod_jewel_radius = mod.get("RadiusJewelType")
        mod_stats = []
        mod_stat_ids = []
        for stat_index in range(1, 7):
            stat = mod.get(f"Stat{stat_index}")
            if stat is None:
                continue
            stat_value = mod.get(f"Stat{stat_index}Value")
            if stat_value is None or not isinstance(stat_value, list):
                continue
            mod_stat_ids.append(stat)
            mod_stats.append(stat_value)

        mod_mod = {
            "mod_index": mod_index,
            "mod_unique_id": mod_unique_id,
            "mod_type": mod_type,
            "mod_level": mod_level,
            "mod_domain": mod_domain,
            "mod_name": mod_name,
            "mod_jewel_radius": mod_jewel_radius,
            "mod_stat_values": mod_stats,
            "mod_stat_ids": mod_stat_ids,
        }
        flat_mods.append(mod_mod)

    logger.info(f"Created {len(flat_mods)} mods")
    # step 2
    by_id = {}
    for mod in flat_mods:
        mod_id_with_trailing_num = mod.get("mod_unique_id")
        mod_id = re.sub(r"\d+$", "", mod_id_with_trailing_num.strip())
        if mod_id not in by_id:
            by_id[mod_id] = []
        by_id[mod_id].append(mod)
    logger.info(f"Created {len(by_id)} unique mods")

    # Filter duplicate stat1 ids, but shortest mod_id (keep shortest)
    shortest_mod_id_by_stat1 = {}
    for mod_id, mod_list in by_id.items():
        stat_list = mod_list[0].get("mod_stat_ids")
        if len(stat_list) < 1:
            shortest_mod_id_by_stat1[uuid.uuid4()] = mod_id
            continue
        stat1_id = stat_list[0]
        if stat1_id in shortest_mod_id_by_stat1:
            if len(mod_id) < len(shortest_mod_id_by_stat1[stat1_id]):
                shortest_mod_id_by_stat1[stat1_id] = mod_id
        else:
            shortest_mod_id_by_stat1[stat1_id] = mod_id

    # Filter by_id to only include shortest mod_id keys
    filtered_by_id = {}
    for stat1_id, mod_id in shortest_mod_id_by_stat1.items():
        filtered_by_id[mod_id] = by_id[mod_id]

    logger.info(f"Created {len(filtered_by_id)} single stat mods")

    return by_id


def get_tier_number_id(id):
    if "shield" in id:
        return "shield"
    elif "armour" in id:
        if "armour" == id:
            return "armour"
        else:
            return "body_armour"
    else:
        return id


def get_gold_tags(mods_in, gold_mod_prices_in, tags_in):
    mods = pd.DataFrame(mods_in)
    gold_mod_prices = pd.DataFrame(gold_mod_prices_in)
    tags = pd.DataFrame(tags_in)

    replace = {
        38: 7,
        39: 7,
        40: 7,
        41: 7,
        42: 7,
        43: 7,
        44: 7,
        226: 1,
        227: 1,
        228: 1,
        229: 1,
        230: 1,
    }

    def process_tags(tags_list, weights_list):
        # Replace tag IDs
        new_tags = [replace[t] if t in replace else t for t in tags_list]

        # Remove sequential duplicate 7s along with corresponding SpawnWeights
        filtered_tags, filtered_weights = [], []
        prev_tag = None
        for tag, weight in zip(new_tags, weights_list):
            if (tag == 7 and prev_tag == 7) or (tag == 1 and prev_tag == 1):
                continue  # Skip duplicate sequential 7
            filtered_tags.append(tag)
            filtered_weights.append(weight)
            prev_tag = tag

        return filtered_tags, filtered_weights

    # Apply transformation to each row
    gold_mod_prices["ProcessedTags"], gold_mod_prices["ProcessedSpawnWeight"] = zip(
        *gold_mod_prices.apply(
            lambda row: process_tags(row["Tags"], row["SpawnWeight"]), axis=1
        )
    )

    category_expansion = {
        7: {16, 4, 22, 25, 1, 45},  # ARMOUR -> Armour pieces
        8: {5, 12, 11, 15, 1010, 14, 13, 1014, 1012, 566},
    }

    # Function to apply logical filtering based on category expansion and removal of 0-weighted tags
    def filter_tags_and_remove_category(tags_list, weights_list, category_expansion):
        tag_dict = {tag: bool(weight) for tag, weight in zip(tags_list, weights_list)}

        # Process category expansions
        expanded_tags = set()
        for tag in tags_list:
            if tag in category_expansion:
                for expanded_tag in category_expansion[tag]:
                    if expanded_tag not in tag_dict:
                        tag_dict[expanded_tag] = (
                            True  # Mark new expanded tags as 1 (true)
                        )
                expanded_tags.add(tag)  # Mark category for removal

        # Remove tags with weight 0 and also remove the original category tags
        filtered_tags = [
            tag for tag, keep in tag_dict.items() if keep and tag not in expanded_tags
        ]

        return filtered_tags

    # Apply the filtering to each row
    gold_mod_prices["FinalTags"] = gold_mod_prices.apply(
        lambda row: filter_tags_and_remove_category(
            row["ProcessedTags"], row["ProcessedSpawnWeight"], category_expansion
        ),
        axis=1,
    )

    gold_explode = gold_mod_prices.explode("FinalTags")
    merged_gold_explode = gold_explode.merge(
        tags, left_on="FinalTags", right_index=True, how="left"
    )
    fixed_gold_mod_prices = (
        merged_gold_explode.groupby("Mod")
        .agg(
            {
                "Id": list,  # Keep the Tag IDs as lists
            }
        )
        .reset_index()
        .rename(columns={"Id": "Tags"})
    )
    fixed_gold_mod_prices["SpawnWeight"] = gold_mod_prices["ProcessedSpawnWeight"]

    gold_with_readable_tags_df = pd.merge(
        fixed_gold_mod_prices[
            fixed_gold_mod_prices["Tags"].apply(
                lambda x: not (
                    isinstance(x, list)
                    and len(x) == 1
                    and isinstance(x[0], float)
                    and np.isnan(x[0])
                )
            )
        ],
        mods,
        left_on="Mod",
        right_index=True,
        how="left",
    )[["Id", "Tags"]]
    gold_with_readable_tags = {
        x["Id"]: x["Tags"] for x in gold_with_readable_tags_df.to_dict(orient="records")
    }
    return gold_with_readable_tags


GENERATION_TYPE = {
    1: "prefix",
    2: "suffix",
    3: "intrinsic",
    4: "nemesis",
    5: "corrupted",
    6: "bloodlines",
    7: "torment",
    8: "tempest",
    9: "talisman",
    10: "enchantment",
    11: "essence",
    12: "unused",
    13: "bestiary",
    14: "delve",
    15: "synthesis unknown",
    16: "synthesis globals",
    17: "synthesis bonus",
    18: "blight",
    19: "blight tower",
    20: "monster affliction",
    21: "enkindling orb",
    22: "instilling orb",
    23: "expedition logbook",
    24: "scourge benefit",
    25: "scourge detriment",
    26: "scourge gimmick",
    27: "unused",
    28: "searing exarch",
    29: "eater of worlds",
    30: "archnemesis",
    31: "crucible passive skill tree",
    32: "crucible passive skill tree mutation",
    33: "affliction wisps",
    34: "necropolis downside",
    35: "necropolis upside",
}


def modTierBuilderB(mod_data, base_item_types, gold_mod_prices, tags):
    gold_with_readable_tags = get_gold_tags(mod_data, gold_mod_prices, tags)

    # Flatten mods data for easier processing
    flat_mods = []
    logger.info("Starting to build mods")
    logger.info(f"Incoming data: {len(mod_data)}")

    for mod in mod_data:
        mod_index = mod.get("_index")
        if mod_index is None:
            continue
        mod_unique_id = mod.get("Id")
        mod_type = mod.get("ModType")
        mod_level = mod.get("Level")
        mod_domain = mod.get("Domain")
        mod_name = mod.get("Name")
        mod_jewel_radius = mod.get("RadiusJewelType")
        gen = mod.get("GenerationType")
        if gen:
            mod_generation = GENERATION_TYPE.get(gen)
        else:
            mod_generation = "unknown"
        mod_stats = []
        mod_stat_ids = []
        mod_allowed_base_types = gold_with_readable_tags.get(mod_unique_id, [])
        if len(mod_allowed_base_types) == 0:
            if mod_unique_id.lower().startswith("jewelradius"):
                mod_allowed_base_types = ["radius_jewel"]
            elif mod_unique_id.lower().startswith("jewel"):
                mod_allowed_base_types = ["jewel"]

        is_processed_map = False
        if mod_unique_id.lower().startswith("map"):
            stat1 = mod.get("Stat1")
            if stat1 == 1004:
                stat2 = mod.get("Stat2")
                stat2_value = mod.get("Stat2Value")

                if stat2 == 1202:
                    stat3 = mod.get("Stat3")
                    stat3_value = mod.get("Stat3Value")
                    if (
                        stat3 is not None
                        and stat3_value is not None
                        and isinstance(stat3_value, list)
                    ):
                        mod_stats.append(stat3_value)
                        mod_stat_ids.append(stat3)
                        is_processed_map = True
                else:
                    mod_stats.append(stat2_value)
                    mod_stat_ids.append(stat2)
                    is_processed_map = True
        if not is_processed_map:
            for stat_index in range(1, 7):
                stat = mod.get(f"Stat{stat_index}")
                if stat is None:
                    continue
                stat_value = mod.get(f"Stat{stat_index}Value")
                if stat_value is None or not isinstance(stat_value, list):
                    continue
                mod_stat_ids.append(stat)
                if stat == 119:
                    mod_stats.append([a / 60 for a in stat_value])
                else:
                    mod_stats.append(stat_value)

        mod_mod = {
            "mod_index": mod_index,
            "mod_unique_id": mod_unique_id,
            "mod_type": mod_type,
            "mod_level": mod_level,
            "mod_domain": mod_domain,
            "mod_name": mod_name,
            "mod_jewel_radius": mod_jewel_radius,
            "mod_stat_values": mod_stats,
            "mod_stat_ids": mod_stat_ids,
            "mod_allowed_base_types": mod_allowed_base_types,
            "mod_generation": mod_generation,
        }
        flat_mods.append(mod_mod)

    logger.info(f"Created {len(flat_mods)} mods")

    # step 2
    by_id = {}
    for mod in flat_mods:
        mod_id_with_trailing_num = mod.get("mod_unique_id")
        mod_id = re.sub(r"\d+_*$", "", mod_id_with_trailing_num.strip())
        if mod_id not in by_id:
            by_id[mod_id] = {
                "mods": [],
                "mods_id": mod_id,
                "mod_type": mod["mod_type"],
                "mod_allowed_base_types": set(mod["mod_allowed_base_types"]),
                "mod_stat_ids": set(mod["mod_stat_ids"]),
                "mod_generation": mod["mod_generation"],
                "mod_jewel_radius": mod["mod_jewel_radius"],
            }
        by_id[mod_id]["mods"].append(mod)
        by_id[mod_id]["mod_stat_ids"] = by_id[mod_id]["mod_stat_ids"].union(
            set(mod["mod_stat_ids"])
        )
        by_id[mod_id]["mod_allowed_base_types"] = by_id[mod_id][
            "mod_allowed_base_types"
        ].union(set(mod["mod_allowed_base_types"]))

    logger.info(f"Created {len(by_id)} unique mods")

    grouped_by_mod_type = defaultdict(list)
    for mod_id, mod_group in by_id.items():
        grouped_by_mod_type[
            mod_group["mod_type"]
            if "radius_jewel" not in mod_group["mod_allowed_base_types"]
            else mod_group["mods_id"]
        ].append(mod_group)

    output_data = []

    for mod_type, mod_groups in grouped_by_mod_type.items():
        one_id = None
        all_stats = set()
        output_tier = None
        for mod_group in mod_groups:
            # HACK: overwrite for things that are not hybrid that should be included
            if mod_group["mods_id"] not in ("ShockEffectUnique__"):
                all_stats = all_stats.union(mod_group["mod_stat_ids"])
            mod_id = mod_group["mods_id"].lower()
            if one_id is None:
                one_id = mod_id
            if (
                mod_group["mod_generation"] == "suffix"
                or mod_group["mod_generation"] == "prefix"
            ) and len(mod_group["mod_allowed_base_types"]) > 0:
                if output_tier is None:
                    output_tier = modGroupToOutputTier(mod_group)
                else:
                    output_tier.update(modGroupToOutputTier(mod_group))
        # NOTE: just based on the dict with most items in it
        output_data.append((tuple(all_stats), output_tier, one_id))
    logger.info(f"Created {len(output_data)} mod groups.")
    return output_data


def modGroupToOutputTier(mod_group):
    base_counts_dict = {
        base: len(
            [mod for mod in mod_group["mods"] if base in mod["mod_allowed_base_types"]]
        )
        if base != "radius_jewel"
        else mod_group["mod_jewel_radius"]
        for base in mod_group["mod_allowed_base_types"]
    }
    return base_counts_dict


if __name__ == "__main__":
    import json

    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/Mods.json",
        "r",
        encoding="utf-8",
    ) as f:
        mod_data = json.load(f)
    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/BaseItemTypes.json",
        "r",
        encoding="utf-8",
    ) as f:
        base_item_data = json.load(f)
    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/GoldModPrices.json",
        "r",
        encoding="utf-8",
    ) as f:
        gold_data = json.load(f)
    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/Tags.json",
        "r",
        encoding="utf-8",
    ) as f:
        tags = json.load(f)
    logging.basicConfig(level=logging.INFO)
    data = modTierBuilderB(mod_data, base_item_data, gold_data, tags)
    for keys, mods, id in data:
        if len(mods["explicit"]) > 1:
            x = mods["explicit"]
            print(x)
