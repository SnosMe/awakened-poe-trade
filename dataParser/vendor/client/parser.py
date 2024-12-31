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
from pprint import pprint

from descriptionParser.descriptionFile import DescriptionFile
from services.logger_setup import set_log_level

logger = logging.getLogger(__name__)

LANG_CODES_TO_NAMES = {
    "en": "English",
    "ru": "Russian",
    "ko": "Korean",
    "cmn-Hant": "Traditional Chinese",
    "ja": "Japanese",
}


def find_first_matching_item(items, field: str, value: str) -> dict | None:
    return next((item for item in items if item.get(field) == value), None)


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
            print(f"[i:{i+1}, id:{id}] {stats_translations[i+1]}")
            print(f"[i:{i+2}, id:{id}] {stats_translations[i+2]}")
            print(f"[i:{i+3}, id:{id}] {stats_translations[i+3]}")
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

            for a in id:
                matchers = []
                if LANG_CODES_TO_NAMES[self.lang] in mod.data:
                    logger.debug(f"Found translations for {mod.english_ref}")
                    matchers = mod.data[LANG_CODES_TO_NAMES[self.lang]]
                else:
                    logger.warning(f"No translations found for {mod.english_ref}")
                    matchers = mod.data["English"]
                if a == "number_of_additional_arrows":
                    matchers.append(
                        {
                            "string": "Bow Attacks fire # additional Arrows",
                            "negate": False,
                        }
                    )
                logger.debug(f"Matchers: {matchers}")
                self.mod_translations[a] = {
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

        for mod in self.mods_file:
            id = mod.get("Id")
            stats_key = mod.get("Stat1")

            logger.debug(f"Processing mod - ID: {id}, Stat: {stats_key}")

            if stats_key is not None:
                stats_id = self.stats.get(stats_key)
                translation = self.mod_translations.get(stats_id)

                if translation:
                    ref = translation.get("ref")
                    matchers = translation.get("matchers")

                    if matchers is None or len(matchers) == 0:
                        logger.warning(f"No matchers found for stats ID: {stats_id}.")
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
                    self.mods[id] = {
                        "ref": translation.get("ref"),
                        "better": 1,
                        "id": stats_id,
                        "matchers": translation.get("matchers"),
                        "trade": trade,
                    }
                else:
                    logger.debug(
                        f"Mod {id} has no translations. [stats_key: {stats_key}, stats_id: {stats_id}]"
                    )
            else:
                logger.debug(
                    f"Mod {id} has no stats_key. [stats_key: {stats_key}, stats_id: {stats_id}]"
                )

        logger.debug("Completed parsing mods.")

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
                text = item.get("text")
                type = item.get("type")
                # unique item
                flags = item.get("flags")
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

                self.unique_items.append(
                    {
                        "name": name,
                        "refName": refName,
                        "namespace": "UNIQUE",
                        "unique": {"base": type},
                    }
                )

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

        seen = set()
        skip = {"maximum_life_%_lost_on_kill"}
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

        # Add temp allocates
        with open(
            f"{self.get_script_dir()}/overrideData/allocates.json",
            "r",
            encoding="utf-8",
        ) as temp_allocates:
            allocates = json.load(temp_allocates)
            if self.lang in allocates:
                m.write(json.dumps(allocates[self.lang], ensure_ascii=False) + "\n")
            else:
                m.write(json.dumps(allocates["en"], ensure_ascii=False) + "\n")
        m.close()

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang+'-out'}/items_dump.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(json.dumps(self.items, indent=4, ensure_ascii=False))

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang+'-out'}/mods_dump.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(json.dumps(self.mods, indent=4, ensure_ascii=False))

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang+'-out'}/matchers_no_trade_ids.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(
                json.dumps(self.matchers_no_trade_ids, indent=4, ensure_ascii=False)
            )

    def add_missing_mods(self):
        phys_local = {
            "en": {"string": "#% increased Physical Damage"},
            "ru": {"string": "#% увеличение физического урона"},
            "ko": {"string": "물리 피해 #% 증가"},
            "cmn-Hant": {"string": "增加 #% 物理傷害"},
            "ja": {"string": "物理ダメージが#%増加する"},
        }
        self.mods["physical_local_damage_+%"] = {
            "ref": "#% increased Physical Damage",
            "better": 1,
            "id": "physical_local_damage_+%",
            "matchers": [phys_local.get(self.lang)],
            "trade": {
                "ids": {
                    "explicit": ["explicit.stat_419810844"],
                    "fractured": ["fractured.stat_419810844"],
                    "rune": ["rune.stat_419810844"],
                }
            },
        }

    def run(self):
        self.parse_trade_ids()
        self.parse_mods()
        self.parse_categories()
        self.parse_items()
        self.resolve_item_classes()
        self.parse_trade_exchange_items()
        self.write_to_file()


if __name__ == "__main__":
    logger.info("Starting parser")
    set_log_level(logging.WARNING)
    Parser("ru").run()
