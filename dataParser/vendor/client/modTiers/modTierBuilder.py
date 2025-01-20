import logging
import os
import re
import uuid
from collections import defaultdict
from pprint import pprint

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


def modTierBuilderB(mod_data, base_item_types, gold_mod_prices, tags):
    gold_with_readable_tags = {
        mod_data[gold_row["Mod"]]["Id"]: {
            tags[tag]["Id"]
            if "armour" not in tags[tag]["Id"] or "armour" == tags[tag]["Id"]
            else "body_armour"
            for tag in gold_row["Tags"]
            if tag
        }
        for gold_row in gold_mod_prices
    }

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
        mod_stats = []
        mod_stat_ids = []
        mod_allowed_base_types = gold_with_readable_tags.get(mod_unique_id, [])
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
        grouped_by_mod_type[mod_group["mod_type"]].append(mod_group)

    output_data = []

    for mod_type, mod_groups in grouped_by_mod_type.items():
        one_id = None
        sorted_row = {
            "explicit": [],
            "implicit": {},
            "corruption": [],
            "crafted": [],
            "jewel": [],
            "corruptionjewel": [],
            "uniquejewel": [],
        }
        all_stats = set()
        for mod_group in mod_groups:
            # HACK: overwrite for things that are not hybrid that should be included
            if mod_group["mods_id"] not in ("ShockEffectUnique__"):
                all_stats = all_stats.union(mod_group["mod_stat_ids"])
            mod_id = mod_group["mods_id"].lower()
            if one_id is None:
                one_id = mod_id
            if "implicit" in mod_id:
                implicit_index = mod_id.index("implicit")
                base_type = mod_id[:implicit_index].lower()
                sorted_row["implicit"][base_type] = modGroupToOutputTier(mod_group)
            elif "unique" in mod_id:
                if "jewel" in mod_id:
                    # sorted_row["uniquejewel"].append(modGroupToOutputTier(mod_group))
                    continue
                else:
                    # sorted_row["unique"].append(modGroupToOutputTier(mod_group))
                    continue
            elif "crafted" in mod_id:
                sorted_row["crafted"].append(modGroupToOutputTier(mod_group))
            elif "jewel" in mod_id:
                sorted_row["jewel"].append(modGroupToOutputTier(mod_group))
            elif "corruption" in mod_id:
                if "jewel" in mod_id:
                    sorted_row["corruptionjewel"].append(
                        modGroupToOutputTier(mod_group)
                    )
                else:
                    sorted_row["corruption"].append(modGroupToOutputTier(mod_group))
            else:
                if len(mod_group["mod_allowed_base_types"]) > 0:
                    sorted_row["explicit"].append(modGroupToOutputTier(mod_group))
                else:
                    # sorted_row["unique"].append(modGroupToOutputTier(mod_group))
                    logger.debug(f"No base type for {mod_group['mods_id']}")
        output_data.append((tuple(all_stats), sorted_row, one_id))
    logger.info(f"Created {len(output_data)} mod groups.")
    return output_data


def modGroupToOutputTier(mod_group):
    base_counts_dict = {
        base: len(
            [mod for mod in mod_group["mods"] if base in mod["mod_allowed_base_types"]]
        )
        for base in mod_group["mod_allowed_base_types"]
    }
    mods = [
        {
            "ilvl": mod["mod_level"],
            "id": mod["mod_unique_id"],
            "name": mod["mod_name"],
            "values": mod["mod_stat_values"],
            "items": list(mod["mod_allowed_base_types"]),
        }
        for mod in mod_group["mods"]
    ]
    output_data = {
        "id": mod_group["mods_id"],
        "items": base_counts_dict,
        "mods": mods,
    }
    return output_data


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
