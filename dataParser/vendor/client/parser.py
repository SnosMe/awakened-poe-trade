"""Tries to prepare the necessary data for poe-trade to work properly.
It requires all files from
Path of Exile 2/Bundles2/_.index.bin/metadata/statdescriptions
NOT
Path of Exile 2/Bundles2/_.index.bin/metadata/statdescriptions/specific_skill_stat_descriptions
to be in the descriptions folder

NOTE: This may or may not contain all the necessary data, as the parser is not perfect and neither is the data
For example: Unique armor items are missing the "armour" tag, which is required for poe-trade to work properly

Credits and Resources:
SnosMe - https://github.com/SnosMe/poe-dat-viewer
SnosMe - https://github.com/SnosMe/awakened-poe-trade
"""

import json
import logging
import os
import re
import urllib.parse
from collections import defaultdict
from copy import deepcopy
from pprint import pprint

from clientStrings.clientStringBuilder import (
    create_client_strings,
    write_client_strings,
)
from descriptionParser.descriptionFile import DescriptionFile
from modTiers.modTierBuilder import modTierBuilderB
from overrideData.buildAnnoints import AnnointBuilder
from services.logger_setup import set_log_level

logger = logging.getLogger(__name__)

LANG_CODES_TO_NAMES = {
    "en": "English",
    "ru": "Russian",
    "ko": "Korean",
    "cmn-Hant": "Traditional Chinese",
    "ja": "Japanese",
    "de": "German",
    "es": "Spanish",
}

HARDCODE_MAP_HYBRID_MODS = {
    "mapmonsterstunailmentthreshold",
    "mapmonsterelementailmentchance",
    "mapmonsterdamageasfire",
    "mapmonsterdamageascold",
    "mapmonsterdamageaslightning",
    "mapmonsterdamageincrease",
    "mapmonsterspeedincrease",
    "mapmonstercritincrease",
    "mapmonsterlifeincrease",
    "mapmonsterelementalresistances",
    "mapmonsterarmoured",
    "mapmonsterevasive",
    "mapmonsterenergyshield",
    "mapmonsterpoisoning",
    "mapmonsterbleeding",
    "mapmonsterarmourbreak",
    "mapmonsteraccuracy",
    "mapmonsterdamageaschaos",
    "mapmonsterstunbuildup",
    "mapmonsteradditionalprojectiles",
    "mapmonsterincreasedareaofeffect",
    "mapplayerenfeeble",
    "mapplayertemporalchains",
    "mapplayerelementalweakness",
    "mapmonsterselementalpenetration",
    "mapplayermaximumresists",
    "mapplayerflaskchargegain",
    "mapplayerrecoveryrate",
    "mapmonstersbaseselfcriticalmultiplier",
    "mapmonsterscurseeffectonself",
    "mapmonstersstealcharges",
    "mapplayercooldownrecovery",
}

HARDCODE_MAP_MODS = {
    "mapdroppeditemrarityincrease",
    "mapdroppedgoldincrease",
    "mapexperiencegainincrease",
    "mappacksizeincrease",
    "maptotaleffectivenessincrease",
    "mapchestcountincrease",
    "mapmagicpackincrease",
    "maprarepackincrease",
    "mapmagicchestcountincrease",
    "maprarechestcountincrease",
    "mapmagicpacksizeincrease",
    # "mapraremonstersadditionalmodifier",
    "mapadditionalshrine",
    "mapadditionalstrongbox",
    "mapadditionalessence",
    "mapmonsteradditionalpacksundead",
    "mapmonsteradditionalpacksbeasts",
    "mapmonsteradditionalpacksezomyte",
    "mapmonsteradditionalpacksfaridun",
    "mapmonsteradditionalpacksvaal",
    "mapmonsteradditionalpacksbaron",
    "mapmonsteradditionalpacksperennial",
    "mapmonsteradditionalpacksdoryani",
    "mapmonsteradditionalpackbramble",
    "mapspreadburningground",
    "mapspreadchilledground",
    "mapspreadshockedground",
    "mapchestsalwaysmagicrare",
    "base_item_found_quantity_+%",
    "map_map_item_drop_chance_+%",
    # "mapsimulacrumdamageasfire",
    # "mapsimulacrumdamageascold",
    # "mapsimulacrumdamageaslightning",
    # "mapsimulacrumdamageaschaos",
    # "mapsimulacrumdamage",
    "mapmonsterdamageasfire",
    "mapmonsterdamageascold",
    "mapmonsterdamageaslightning",
    "mapmonsterdamageincrease",
    "mapmonsterspeedincrease",
    "mapmonstercritincrease",
    "mapmonsterlifeincrease",
    "mapmonsterelementalresistances",
    "mapmonsterarmoured",
    "mapmonsterevasive",
    "mapmonsterenergyshield",
    "mapmonsterpoisoning",
    "mapmonsterbleeding",
    "mapmonsterarmourbreak",
    "mapmonsteraccuracy",
    "mapmonsterdamageaschaos",
    "mapmonsterstunbuildup",
    "mapmonsteradditionalprojectiles",
    "mapmonsterincreasedareaofeffect",
    "mapplayerenfeeble",
    "mapplayertemporalchains",
    "mapplayerelementalweakness",
    "mapmonsterselementalpenetration",
    "mapplayermaximumresists",
    "mapplayerflaskchargegain",
    "mapplayerrecoveryrate",
    "mapmonstersbaseselfcriticalmultiplier",
    "mapmonsterscurseeffectonself",
    "mapmonstersstealcharges",
    "mapplayercooldownrecovery",
}

BETTER_NOT_1 = {"local_attribute_requirements_+%": -1}


def find_first_matching_item(items, field: str, value: str) -> dict | None:
    return next((item for item in items if item.get(field) == value), None)


def flatten_stats_ids(input_data):
    if isinstance(input_data, list):
        if len(input_data) == 1:
            return input_data[0]
        else:
            result = {}
            for item in input_data:
                for key, values in item.items():
                    if key not in result:
                        result[key] = []
                    result[key].extend(values)
            return result
    elif isinstance(input_data, dict):
        return input_data
    else:
        raise ValueError("Invalid input format")


def flatten_mods(mods):
    # Create a dictionary to group mods by "ref"
    grouped_mods = defaultdict(
        lambda: {
            "ref": None,
            "better": None,
            "id": None,
            "matchers": [],
            "trade": {"ids": None},  # Default to None for trade.ids
            # "tiers": None,  # Default to None for tiers
            # "hybrids": {},
        }
    )

    for base_id, mod in mods.items():
        ref = mod["ref"]
        if not grouped_mods[ref]["ref"]:
            grouped_mods[ref]["ref"] = ref
            grouped_mods[ref]["better"] = mod["better"]
            grouped_mods[ref]["id"] = mod["id"]

        # Merge matchers
        for matcher in mod.get("matchers") or []:
            if matcher not in grouped_mods[ref]["matchers"]:
                grouped_mods[ref]["matchers"].append(matcher)

        # Merge trade IDs
        if grouped_mods[ref]["trade"]["ids"] is None:
            grouped_mods[ref]["trade"]["ids"] = (
                None if mod["trade"]["ids"] is None else deepcopy(mod["trade"]["ids"])
            )
        elif mod["trade"]["ids"] is not None:
            # Merge trade.ids only if both are not None
            for key, ids in mod["trade"]["ids"].items():
                grouped_mods[ref]["trade"]["ids"].setdefault(key, []).extend(ids)

        # Merge tiers
        # if grouped_mods[ref]["tiers"] is None:
        #     grouped_mods[ref]["tiers"] = (
        #         None if "tiers" not in mod else deepcopy(mod["tiers"])
        #     )
        # elif "tiers" in mod and mod["tiers"] is not None:
        #     for tier_type, tier_data in mod["tiers"].items():
        #         if tier_type == "implicit":
        #             # Merge implicit tiers (dictionary)
        #             for base_type, implicit_data in tier_data.items():
        #                 if base_type not in grouped_mods[ref]["tiers"]["implicit"]:
        #                     grouped_mods[ref]["tiers"]["implicit"][base_type] = (
        #                         deepcopy(implicit_data)
        #                     )
        #                 else:
        #                     grouped_mods[ref]["tiers"]["implicit"][base_type][
        #                         "mods"
        #                     ].extend(deepcopy(implicit_data["mods"]))
        #         else:
        #             # Merge list-based tiers
        #             grouped_mods[ref]["tiers"][tier_type].extend(deepcopy(tier_data))

        # Merge fromAreaMods
        if "fromAreaMods" in grouped_mods[ref]:
            grouped_mods[ref]["fromAreaMods"] = grouped_mods[ref]["fromAreaMods"] or (
                False if "fromAreaMods" not in mod else mod["fromAreaMods"]
            )
        elif "fromAreaMods" in mod:
            grouped_mods[ref]["fromAreaMods"] = mod["fromAreaMods"]

        # Merge hybrids
        # if "hybrids" in mod and mod["hybrids"]:
        #     for hybrid_ref, valid_equipment in mod["hybrids"].items():
        #         if hybrid_ref in grouped_mods[ref]["hybrids"]:
        #             grouped_mods[ref]["hybrids"][hybrid_ref].extend(
        #                 item
        #                 for item in valid_equipment
        #                 if item not in grouped_mods[ref]["hybrids"][hybrid_ref]
        #             )
        #         else:
        #             grouped_mods[ref]["hybrids"][hybrid_ref] = list(
        #                 valid_equipment
        #             )  # Ensure list type

    # Convert back to dictionary with unique base_ids
    flattened_mods = {}
    for i, (ref, group) in enumerate(grouped_mods.items()):
        # Deduplicate trade IDs if they are not None
        if group["trade"]["ids"] is not None:
            group["trade"]["ids"] = {
                k: list(set(v)) for k, v in group["trade"]["ids"].items()
            }
        flattened_mods[f"merged_{i}"] = group  # Use a new unique key for merged mods

    return flattened_mods


def add_unique_mods(mods, unique_override_data, words_lookup):
    for mod in mods.values():
        ref = mod["ref"]
        if ref in unique_override_data and mod["tiers"] is not None:
            out_mods = {}
            for unique_name, stat_values in unique_override_data[ref].items():
                out_mods[unique_name] = stat_values
                # if unique_name in words_lookup:
                # out_mods[words_lookup[unique_name]] = stat_values
            mod["tiers"]["unique"] = out_mods
    return mods


class Parser:
    def get_script_dir(self):
        """Returns the directory where the script is located."""
        return os.path.dirname(os.path.realpath(__file__))

    def load_file(self, file, is_en=False):
        logger.info(
            f"LOADING FILE: ++ {self.base_dir}{self.lang if not is_en else 'en'}/{file}.json"
        )
        return json.loads(
            open(
                f"{self.base_dir}{self.lang if not is_en else 'en'}/{file}.json",
                encoding="utf-8",
            ).read()
        )

    def __init__(self, lang="en"):
        self.lang = lang

        self.cwd = self.get_script_dir()
        self.base_dir = self.cwd + "/tables/"
        self.out_dir = self.cwd + f"/pyDumps/{self.lang}"
        self.base_items = self.load_file("BaseItemTypes")
        self.item_classes = self.load_file("ItemClasses")
        self.item_class_categories = self.load_file("ItemClassCategories")
        self.armour_types = self.load_file("ArmourTypes")
        self.weapon_types = self.load_file("WeaponTypes")
        self.skill_gems = self.load_file("SkillGems")
        self.skill_gem_info = self.load_file("SkillGemInfo")
        self.stats_file = self.load_file("Stats")
        self.translation_files = os.listdir(f"{self.cwd}/descriptions")
        self.mods_file = self.load_file("Mods")
        self.words_file = self.load_file("Words")
        self.gold_mod_prices = self.load_file("GoldModPrices")
        self.tags = self.load_file("Tags")
        self.client_strings_file = self.load_file("ClientStrings")
        # NOTE: could need to add local here?
        self.trade_stats = json.loads(
            open(
                f"{self.cwd}/../json-api/{self.lang}/stats.json", encoding="utf-8"
            ).read()
        )  # content of https://www.pathofexile.com/api/trade2/data/stats
        self.trade_items = json.loads(
            open(
                f"{self.cwd}/../json-api/{self.lang}/items.json", encoding="utf-8"
            ).read()
        )  # content of https://www.pathofexile.com/api/trade2/data/items
        self.trade_exchange_items = json.loads(
            open(
                f"{self.cwd}/../json-api/{self.lang}/static.json", encoding="utf-8"
            ).read()
        )  # content of https://www.pathofexile.com/api/trade2/data/static

        self.items = {}
        self.unique_items = []
        self.parsed_item_class_categories = {}
        self.parsed_item_classes = {}
        self.stats = {}
        self.stats_trade_ids = {}
        self.mod_translations = {}
        self.mods = {}
        self.matchers_no_trade_ids = []
        self.tiers = {}

        base_en = self.load_file("BaseItemTypes", is_en=True)
        self.base_en_items_lookup = dict()
        for item in base_en:
            id = item.get("_index")
            if id is None:
                continue
            name = item.get("Name")
            if name is None:
                continue
            self.base_en_items_lookup[id] = name

    def make_poe_cdn_url(self, path):
        return urllib.parse.urljoin("https://web.poecdn.com/", path)

    def convert_stat_name(self, stat):
        stat = stat.strip()
        open_square_bracket = stat.find("[")
        close_square_bracket = stat.find("]")

        while open_square_bracket >= 0 and close_square_bracket > 0:
            # resolve brackets, this can be either the plain text or a key|value pair
            key = stat[open_square_bracket + 1 : close_square_bracket]

            if "|" in key:  # key|value pair
                key = key.split("|")[1]  # use value
            stat = stat[:open_square_bracket] + key + stat[close_square_bracket + 1 :]

            open_square_bracket = stat.find("[")
            close_square_bracket = stat.find("]")

        pattern = re.compile(r"{\d+}")
        for match in pattern.findall(stat):
            stat = stat.replace(match, "#")

        stat = stat.replace("{0:+d}", "+#")

        if len(stat) == 0:
            return None

        if stat[0] == "{" and stat[1] == "}":
            stat = "#" + stat[2:]

        return stat

    def parse_trade_ids(self):
        logger.debug("Starting to parse trade IDs.")
        for res in self.trade_stats["result"]:
            for entry in res.get("entries"):
                id = entry.get("id")
                text = entry.get("text")
                type = entry.get("type")
                text = self.convert_stat_name(text)

                text = text.replace("+#", "#")

                logger.debug(f"Processing entry - ID: {id}, Text: {text}, Type: {type}")

                if text not in self.stats_trade_ids:
                    self.stats_trade_ids[text] = {}

                if type not in self.stats_trade_ids[text]:
                    self.stats_trade_ids[text][type] = []

                self.stats_trade_ids[text][type].append(id)

        logger.debug("Completed parsing trade IDs.")

    def parse_mod(self, id, lines, log=False):
        matchers = []
        ref = None

        for line in lines:
            line = self.convert_stat_name(line)

            if line is None:
                continue

            matcher = line
            # remove prefixes
            if matcher[0] == "+":
                matcher = matcher[1:]

            has_negate = matcher.find("negate") > 0

            if has_negate:
                matcher = matcher[: matcher.find('"')].strip()

            if "flask_charges_used_+%" in id or "charm_charges_used_+%" in id:
                has_negate = not has_negate

            matchers.append({"string": matcher, "negate": has_negate})

            if ref is None:
                ref = line

        id = id.split(" ")

        for a in id:
            if a == "number_of_additional_arrows":
                matchers.append(
                    {"string": "Bow Attacks fire # additional Arrows", "negate": False}
                )
            # may just need to force the english one here?
            self.mod_translations[a] = {
                "ref": ref,
                "matchers": matchers,
            }

    def parse_translation_line(self, stats_translations, i, id, log=False):
        if log:
            print(
                "===================================================================="
            )
            print(f"[i:{i}, id:{id}] {stats_translations[i]}")
            print(f"[i:{i + 1}, id:{id}] {stats_translations[i + 1]}")
            print(f"[i:{i + 2}, id:{id}] {stats_translations[i + 2]}")
            print(f"[i:{i + 3}, id:{id}] {stats_translations[i + 3]}")
        line = stats_translations[i + 3].strip()  # skip first 2 characters
        start = line.find('"')
        end = line.rfind('"')
        line = line[start + 1 : end]

        # convert to array so we can add the negated option later on, if one exists
        line = [line]

        negate_line = stats_translations[i + 4].strip()
        if "lang" not in negate_line and "negate" in negate_line:
            # mod has a negated version
            end = negate_line.find("negate")
            negate_line = negate_line[negate_line.find('"') + 1 : end + len("negate")]
            line.append(negate_line)
        self.parse_mod(id, line, log=log)

    def parse_translation_file(self, file):
        dir = f"{self.cwd}/descriptions/{file}"
        print("Parsing", dir)
        stats_translations = open(dir, encoding="utf-16").read().split("\n")
        should_log = True
        for i in range(0, len(stats_translations)):
            line = stats_translations[i]

            if line == "description":
                # start of the translation block
                id = (
                    stats_translations[i + 1].strip()[2:].replace('"', "")
                )  # skip first 2 characters

                if self.lang == "en":
                    self.parse_translation_line(
                        stats_translations, i, id, log=should_log
                    )
                    should_log = False
                else:
                    j = i
                    while (
                        j + 5 < 100
                        and stats_translations[j + 1] != "description"
                        and LANG_CODES_TO_NAMES[self.lang]
                        not in stats_translations[j + 1]
                    ):
                        j += 1
                    if should_log:
                        print(
                            f"Parsing [j:{j + 1}, id:{id}] {stats_translations[j + 1]}"
                        )
                    if stats_translations[j + 1] != "description":
                        self.parse_translation_line(
                            stats_translations, j, id, log=should_log
                        )
                        should_log = False

    def new_parse_translation_file(self, file):
        dir = f"{self.cwd}/descriptions/{file}"
        print("Parsing", dir)
        description_file = DescriptionFile(dir)

        for mod in description_file.descriptions:
            id = mod.id.split(" ")

            for description_id in id:
                matchers = []
                if LANG_CODES_TO_NAMES[self.lang] in mod.data:
                    logger.debug(f"Found translations for {mod.english_ref}")
                    matchers = mod.data[LANG_CODES_TO_NAMES[self.lang]]
                else:
                    logger.warning(f"No translations found for {mod.english_ref}")
                    matchers = mod.data["English"]
                if description_id == "number_of_additional_arrows":
                    matchers.append(
                        {
                            "string": "Bow Attacks fire # additional Arrows",
                            "negate": False,
                        }
                    )
                logger.debug(f"Matchers: {matchers}")
                if "map" in description_id:
                    if description_id in self.mod_translations:
                        self.mod_translations[description_id]["ref"] = mod.english_ref
                        self.mod_translations[description_id]["matchers"] = (
                            matchers + self.mod_translations[description_id]["matchers"]
                        )
                    else:
                        self.mod_translations[description_id] = {
                            "ref": mod.english_ref,
                            "matchers": matchers,
                        }
                else:
                    self.mod_translations[description_id] = {
                        "ref": mod.english_ref,
                        "matchers": matchers,
                    }

    def parse_mods(self):
        logger.debug("Starting to parse mods.")

        for stat in self.stats_file:
            id = stat.get("_index")
            name = stat.get("Id")

            logger.debug(f"Processing stat - ID: {id}, Name: {name}")

            self.stats[id] = name

        logger.info(f"Stats: {len(self.stats)}")

        # translations
        for file in self.translation_files:
            logger.debug(f"Checking translation file: {file}")

            if os.path.isdir(f"{self.cwd}/descriptions/{file}"):
                # traverse directories if it doesn't start with _
                if not file.startswith("_"):
                    for _file in os.listdir(f"{self.cwd}/descriptions/{file}"):
                        logger.debug(f"Parsing translation file: {file}/{_file}")
                        self.new_parse_translation_file(f"{file}/{_file}")
            elif ".csd" in file:
                logger.debug(f"Parsing translation file: {file}")
                self.new_parse_translation_file(file)

        logger.info(f"Mod translations: {len(self.mod_translations)}")

        hybrid_count = 0
        hybrids = []

        stats_from_tiers = set()

        def better(x):
            return 1 if x not in BETTER_NOT_1 else BETTER_NOT_1[x]

        for in_ids, tiers, base_id in modTierBuilderB(
            self.mods_file, self.base_items, self.gold_mod_prices, self.tags
        ):
            value_counts = len(in_ids)
            if in_ids is None or value_counts < 1:
                logger.debug(f"No stat_ids for {base_id}")
                continue
            ids_list = []
            translations = []
            stat_id = None

            for stats_key in in_ids:
                logger.debug(f"Processing mod - ID: {base_id}, Stat: {stats_key}")

                if stats_key is not None:
                    stats_id = self.stats.get(stats_key)
                    translation = self.mod_translations.get(stats_id)

                    if translation:
                        ref = translation.get("ref")
                        matchers = translation.get("matchers")

                        if matchers is None or len(matchers) == 0:
                            logger.warning(
                                f"No matchers found for stats ID: {stats_id}."
                            )
                            continue

                        ids = self.stats_trade_ids.get(matchers[0].get("string"))
                        if stat_id is None:
                            stat_id = stats_id

                        if ids is None and len(matchers) > 1:
                            ids = self.stats_trade_ids.get(matchers[1].get("string"))
                            if ids is None:
                                logger.warning(
                                    f"No trade IDs found for matchers: {matchers[0].get('string')} or {matchers[1].get('string')}."
                                )
                                self.matchers_no_trade_ids.extend(
                                    [
                                        matchers[0].get("string"),
                                        matchers[1].get("string"),
                                    ]
                                )
                        elif ids is None:
                            logger.warning(
                                f"No trade IDs found for matcher: {matchers[0].get('string')}."
                            )
                            self.matchers_no_trade_ids.append(matchers[0].get("string"))

                        ids_list.append(ids)
                        translations.append(translation)
                    else:
                        logger.debug(
                            f"Mod {base_id} has no translations. [stats_key: {stats_key}, stats_id: {stats_id}]"
                        )
                else:
                    logger.debug(
                        f"Mod {base_id} has no stats_key. [stats_key: {stats_key}, stats_id: {stats_id}]"
                    )
            if len(translations) == 0:
                logger.debug(
                    f"Mod {base_id} has no stats_key. [stats_key: {stats_key}, stats_id: {stats_id}]"
                )
                continue

            ids_list_noneless = [x for x in ids_list if x is not None]

            if len(ids_list_noneless) == 0:
                flatten_stats = None
            else:
                flatten_stats = flatten_stats_ids(ids_list_noneless)
            trade = {"ids": flatten_stats}
            if base_id in self.mods:
                logger.warn(f"Duplicate mod {base_id}")

            # first where ref is not none
            main_translation = next(
                (x for x in translations if x.get("ref") is not None), None
            )

            if main_translation is None:
                continue

            if (
                len(translations) > 1
                and base_id not in HARDCODE_MAP_HYBRID_MODS
                and main_translation.get("ref").count("#") == 1
            ):
                # first translation where
                hybrid_count += 1
                hybrids.append((base_id, translations, tiers))
            else:
                stats_from_tiers.add(stat_id)
                if base_id in HARDCODE_MAP_HYBRID_MODS:
                    non_waystone_translations = [
                        t
                        for t in translations
                        if "waystone" not in t.get("ref").lower()
                    ]
                    for index, allowed_hybrid_translation in enumerate(
                        non_waystone_translations
                    ):
                        self.mods[f"{base_id}_{index}"] = {
                            "ref": allowed_hybrid_translation.get("ref"),
                            "better": better(stats_id),
                            "id": f"{base_id}_{index}",
                            "matchers": allowed_hybrid_translation.get("matchers"),
                            "trade": {"ids": ids_list[index]},
                            "fromAreaMods": True,
                        }
                else:
                    self.mods[base_id] = {
                        "ref": main_translation.get("ref"),
                        "better": better(stats_id),
                        "id": stat_id,
                        "matchers": main_translation.get("matchers"),
                        "trade": trade,
                    }
                    if base_id in HARDCODE_MAP_MODS:
                        self.mods[base_id]["fromAreaMods"] = True

            if tiers is not None:
                tier_refs = [t.get("ref") for t in translations]
                tier_ref_strings = "\n".join(dict.fromkeys(tier_refs))
                if tier_ref_strings in self.tiers:
                    self.tiers[tier_ref_strings].update(tiers)
                else:
                    self.tiers[tier_ref_strings] = tiers

        for mod in self.mods_file:
            id = mod.get("Id")
            stats_key = mod.get("Stat1")

            logger.debug(f"Processing mod - ID: {id}, Stat: {stats_key}")

            if stats_key is not None:
                stats_id = self.stats.get(stats_key)
                translation = self.mod_translations.get(stats_id)

                if stats_id in stats_from_tiers:
                    continue

                if translation:
                    ref = translation.get("ref")
                    matchers = translation.get("matchers")

                    if matchers is None or len(matchers) == 0:
                        logger.warning(f"No matchers found for stats ID: {stats_id}.")
                        continue

                    if ref is None:
                        logger.warning(f"No ref found for stats ID: {stats_id}.")
                        continue

                    ids = self.stats_trade_ids.get(matchers[0].get("string"))

                    if ids is None and len(matchers) > 1:
                        ids = self.stats_trade_ids.get(matchers[1].get("string"))
                        if ids is None:
                            logger.warning(
                                f"No trade IDs found for matchers: {matchers[0].get('string')} or {matchers[1].get('string')}."
                            )
                            self.matchers_no_trade_ids.extend(
                                [matchers[0].get("string"), matchers[1].get("string")]
                            )
                    elif ids is None:
                        logger.warning(
                            f"No trade IDs found for matcher: {matchers[0].get('string')}."
                        )
                        self.matchers_no_trade_ids.append(matchers[0].get("string"))

                    trade = {"ids": ids}
                    stats_from_tiers.add(stats_id)
                    if id in self.mods:
                        logger.error(f"Duplicate mod ID found: {id}. Skipping mod.")
                        continue
                    self.mods[id] = {
                        "ref": translation.get("ref"),
                        "better": better(stats_id),
                        "id": stats_id,
                        "matchers": translation.get("matchers"),
                        "trade": trade,
                    }
                    if stats_id in HARDCODE_MAP_MODS:
                        self.mods[id]["fromAreaMods"] = True
                else:
                    logger.debug(
                        f"Mod {id} has no translations. [stats_key: {stats_key}, stats_id: {stats_id}]"
                    )
            else:
                logger.debug(
                    f"Mod {id} has no stats_key. [stats_key: {stats_key}, stats_id: {stats_id}]"
                )

        # for base_id, translations, tiers in hybrids:
        #     # Collect all valid equipment for this hybrid
        #     valid_equipment = {
        #         item
        #         for tier_group in tiers["explicit"]
        #         for item in tier_group["items"].keys()
        #     }

        #     for hybrid_translation in translations:
        #         for mod in self.mods.values():
        #             if mod["ref"] == hybrid_translation["ref"]:
        #                 if "hybrids" not in mod:
        #                     mod["hybrids"] = {}

        #                 # Iterate over all other hybrid translations (except the current one)
        #                 for not_same_hybrid_translation in translations:
        #                     if (
        #                         not_same_hybrid_translation["ref"]
        #                         == hybrid_translation["ref"]
        #                     ):
        #                         continue  # Skip itself

        #                     hybrid_ref = not_same_hybrid_translation["ref"]

        #                     if hybrid_ref in mod["hybrids"]:
        #                         mod["hybrids"][hybrid_ref].update(valid_equipment)
        #                     else:
        #                         mod["hybrids"][hybrid_ref] = set(valid_equipment)

        logger.debug("Completed parsing mods.")
        logger.info(f"Mods: {len(self.mods)}")
        # logger.info(f"Hybrid mods: {hybrid_count}")

    def parse_categories(self):
        # parse item categories
        for cat in self.item_class_categories:
            id = cat.get("_index")
            if id is None:
                continue

            text = cat.get("Id")
            self.parsed_item_class_categories[id] = text

        for cat in self.item_classes:
            id = cat.get("_index")
            if id is None:
                continue

            text = cat.get("Id")
            self.parsed_item_classes[id] = {
                "name": text,
                "short": self.parsed_item_class_categories.get(
                    cat.get("ItemClassCategory")
                ),
            }

    def parse_items(self):
        for entry in self.trade_items["result"]:
            for item in entry.get("entries"):
                name = item.get("name")
                if name is None:
                    continue
                type = item.get("type")
                # unique item
                refName = name

                # id = item.get("_index")
                # if id is not None:
                #     if id in self.base_en_items_lookup:
                #         refName = self.base_en_items_lookup[id]

                # get first value in words file
                words_entry = find_first_matching_item(self.words_file, "Text2", name)
                if words_entry is not None:
                    refName = words_entry.get("Text")

                refType = type
                id = find_first_matching_item(self.base_items, "Name", type)
                if id is not None:
                    index = id.get("_index")
                    if index is not None and index in self.base_en_items_lookup:
                        refType = self.base_en_items_lookup[index]

                unique_item = {
                    "name": name,
                    "refName": refName,
                    "namespace": "UNIQUE",
                    "unique": {"base": refType},
                    "icon": "%NOT_FOUND%",
                }

                self.unique_items.append(unique_item)

        # parse base items
        for item in self.base_items:
            id = item.get("_index")
            if id is None:
                continue

            name = item.get("Name")

            if len(name) == 0:
                continue

            class_key = item.get("ItemClass")
            refName = name
            if id in self.base_en_items_lookup:
                refName = self.base_en_items_lookup[id]

            # update name to localized keep ref name as english
            self.items[id] = {
                "name": name,
                "refName": refName,
                "namespace": "ITEM",
                "class": class_key,
                "dropLevel": item.get("DropLevel"),
                "width": item.get("Width"),
                "height": item.get("Height"),
            }

            if class_key is not None:
                class_info = self.parsed_item_classes.get(class_key).get("short")
                # if class_info in ["Belt", "Ring", "Amulet"]:
                if class_info is not None:
                    self.items[id].update({"craftable": {"category": class_info}})

        # convert base items into gems
        for gem in self.skill_gems:
            id = gem.get("BaseItemType")
            if id in self.items:
                self.items[id].update(
                    {
                        "namespace": "GEM",
                        "gem": {"awakened": False, "transfigured": False},
                    }
                )

        # weapons and armor need the craftable tag ("craftable": "type (helmet, boots etc)")
        # convert base items into weapons
        for wpn in self.weapon_types:
            id = wpn.get("BaseItemType")

            if id in self.items:
                class_key = self.items[id].get("class")
                self.items[id].update(
                    {
                        "craftable": {
                            "category": self.parsed_item_classes.get(class_key).get(
                                "short"
                            ),
                        }
                    }
                )

        # convert base items into armor types
        # armour needs the armour tag ("armour": "ar": [min, max], "ev": [min, max], "es": [min, max])
        # Changed since db only has one value for each stat
        for armour in self.armour_types:
            id = armour.get("BaseItemType")

            ar = [armour.get("Armour"), armour.get("Armour")]
            ev = [armour.get("Evasion"), armour.get("Evasion")]
            es = [armour.get("EnergyShield"), armour.get("EnergyShield")]

            armour = {}

            if ar[1] > 1:
                armour["ar"] = ar

            if ev[1] > 1:
                armour["ev"] = ev

            if es[1] > 1:
                armour["es"] = es

            if id in self.items:
                self.items[id].update({"armour": armour})

    def parse_trade_exchange_items(self):
        items_ids = {}
        for id, item in self.items.items():
            items_ids[item.get("name")] = id

        for category in self.trade_exchange_items["result"]:
            for entry in category.get("entries"):
                item_name = entry.get("text")

                if item_name not in items_ids:
                    continue

                self.items[items_ids[item_name]].update(
                    {
                        "tradeTag": entry.get("id"),
                        "icon": self.make_poe_cdn_url(entry.get("image")),
                    }
                )

    def resolve_item_classes(self):
        for item_class in self.item_classes:
            id = item_class.get("_index")
            if id is None:
                continue

            name = item_class.get("Name")
            item_class_category = item_class.get("ItemClassCategory")

            if id in self.items:
                self.items[id].update(
                    {
                        "class": name,
                        "category": self.parsed_item_classes.get(item_class_category),
                    }
                )

    def write_to_file(self):
        f = open(f"{self.out_dir}/items.ndjson", "w", encoding="utf-8")
        items_name = sorted(self.items.values(), key=lambda x: x.get("name"))
        for item in items_name:
            name = item.get("name")
            refName = item.get("refName")
            namespace = item.get("namespace", "ITEM")
            craftable = item.get("craftable", None)
            gem = item.get("gem", None)
            armour = item.get("armour", None)
            width = item.get("width", None)
            height = item.get("height", None)
            tradeTag = item.get("tradeTag", None)
            icon = item.get("icon", "%NOT_FOUND%")

            out = {
                "name": name,
                "refName": refName,
                "namespace": namespace,
                "icon": icon,
            }

            if tradeTag:
                out.update({"tradeTag": tradeTag})

            if craftable:
                out.update({"craftable": craftable})

            if armour:
                out.update({"armour": armour})

            if width:
                out.update({"w": width})

            if height:
                out.update({"h": height})

            if gem:
                out.update({"gem": gem})

            f.write(json.dumps(out, ensure_ascii=False) + "\n")

        for item in self.unique_items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

        f.close()

        logger.info(f"Writing stats to {self.out_dir}/stats.ndjson")
        logger.info(
            f"Writing ~{len(self.mods.values())} mods to {self.out_dir}/stats.ndjson"
        )

        # somehow not a thing? - possibly missing some data

        self.add_missing_mods()

        self.mods = flatten_mods(self.mods)

        seen = set()
        skip = {"maximum_life_%_lost_on_kill", "base_spirit"}
        m = open(
            f"{self.out_dir}/stats.ndjson",
            "w",
            encoding="utf-8",
        )
        for mod in self.mods.values():
            id = mod.get("id")

            if id in seen or id in skip:
                continue

            m.write(json.dumps(mod, ensure_ascii=False) + "\n")
            seen.add(id)

        annoints = AnnointBuilder().get_annoints(self.lang)
        m.write(json.dumps(annoints, ensure_ascii=False) + "\n")

        # Add temp allocates
        # with open(
        #     f"{self.get_script_dir()}/overrideData/allocates.json",
        #     "r",
        #     encoding="utf-8",
        # ) as temp_allocates:
        #     allocates = json.load(temp_allocates)
        #     if self.lang in allocates:
        #         m.write(json.dumps(allocates[self.lang], ensure_ascii=False) + "\n")
        #     else:
        #         m.write(json.dumps(allocates["en"], ensure_ascii=False) + "\n")
        m.close()

        if self.lang == "en":
            with open(
                f"{self.get_script_dir()}/pyDumps/generic/tiers.json",
                "w",
                encoding="utf-8",
            ) as j:
                j.write(json.dumps(self.tiers, ensure_ascii=False))

            with open(
                f"{self.get_script_dir()}/pyDumps/generic-out/tiers_dump.json",
                "w",
                encoding="utf-8",
            ) as f:
                f.write(json.dumps(self.tiers, indent=4, ensure_ascii=False))

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang + '-out'}/items_dump.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(json.dumps(self.items, indent=4, ensure_ascii=False))

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang + '-out'}/mods_dump.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(json.dumps(self.mods, indent=4, ensure_ascii=False))

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang + '-out'}/matchers_no_trade_ids.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(
                json.dumps(self.matchers_no_trade_ids, indent=4, ensure_ascii=False)
            )

    def add_missing_mods(self):
        with open(
            f"{self.get_script_dir()}/overrideData/matchersOverwride.json",
            "r",
            encoding="utf-8",
        ) as f:
            override_matchers = json.load(f)
        phys_local = {
            "en": {"string": "#% increased Physical Damage"},
            "ru": {"string": "#% увеличение физического урона"},
            "ko": {"string": "물리 피해 #% 증가"},
            "cmn-Hant": {"string": "增加 #% 物理傷害"},
            "ja": {"string": "物理ダメージが#%増加する"},
            "de": {"string": "#% erhöhte physischen Schaden"},
            "es": {"string": "#% de daño físico aumentado"},
        }
        # somehow not a thing? - possibly missing some data
        # self.mods["physical_local_damage_+%"] = {
        #     "ref": "#% increased Physical Damage",
        #     "better": 1,
        #     "id": "physical_local_damage_+%",
        #     "matchers": [phys_local.get(self.lang)],
        #     "trade": {
        #         "ids": {
        #             "explicit": ["explicit.stat_419810844"],
        #             "fractured": ["fractured.stat_419810844"],
        #             "rune": ["rune.stat_419810844"],
        #         }
        #     },
        # }

        # Controlled Metamorphosis
        controlled_metamorphosis = override_matchers["Controlled Metamorphosis"][
            self.lang
        ]
        self.mods["local_jewel_variable_ring_radius_value"] = {
            "ref": "Only affects Passives in # Ring",
            "better": 1,
            "id": "local_jewel_variable_ring_radius_value",
            "matchers": controlled_metamorphosis,
            "trade": {
                "ids": {
                    "explicit": ["explicit.stat_3642528642"],
                }
            },
        }
        charm_slots = override_matchers["Charm Slots"][self.lang]
        self.mods["charm_slots"] = {
            "ref": "+# Charm Slot",
            "better": 1,
            "id": "local_charm_slots",
            "matchers": charm_slots,
            "trade": {"ids": {}},
        }
        with open(
            f"{self.get_script_dir()}/overrideData/logbook_overrides.json",
            "r",
            encoding="utf-8",
        ) as f:
            logbook_overrides = json.load(f)
        factions = logbook_overrides[self.lang]
        for faction in factions:
            self.mods[faction["ref"]] = faction

    def do_client_strings(self):
        cl = create_client_strings(self.client_strings_file)
        out_string = write_client_strings(cl)
        print(out_string)
        # with open(
        #     f"{self.get_script_dir()}/pyDumps/{self.lang}/client_strings.js",
        #     "w",
        #     encoding="utf-8",
        # ) as f:
        #     f.write(out_string)

    def run(self):
        self.parse_trade_ids()
        self.parse_mods()
        self.parse_categories()
        self.parse_items()
        self.resolve_item_classes()
        self.parse_trade_exchange_items()
        self.write_to_file()
        self.do_client_strings()


if __name__ == "__main__":
    logger.info("Starting parser")
    set_log_level(logging.WARNING)
    Parser("en").run()
