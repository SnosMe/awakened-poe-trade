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
import os
import re
import urllib.parse

import requests


class Parser:
    def get_script_dir(self):
        """Returns the directory where the script is located."""
        return os.path.dirname(os.path.realpath(__file__))

    def load_file(self, file):
        return json.loads(open(f"{self.base_dir}/{self.lang}/{file}.json").read())

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
        # NOTE: could need to add local here?
        self.trade_stats = json.loads(
            open(f"{self.cwd}/../json-api/en/stats.json").read()
        )  # content of https://www.pathofexile.com/api/trade2/data/stats
        self.trade_items = json.loads(
            open(f"{self.cwd}/../json-api/en/items.json").read()
        )  # content of https://www.pathofexile.com/api/trade2/data/items
        self.trade_exchange_items = json.loads(
            open(f"{self.cwd}/../json-api/en/static.json").read()
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
        for res in self.trade_stats["result"]:
            for entry in res.get("entries"):
                id = entry.get("id")
                text = entry.get("text")
                type = entry.get("type")
                text = self.convert_stat_name(text)

                if text not in self.stats_trade_ids:
                    self.stats_trade_ids[text] = {}

                if type not in self.stats_trade_ids[text]:
                    self.stats_trade_ids[text][type] = []

                self.stats_trade_ids[text][type].append(id)

    def parse_mod(self, id, english):
        matchers = []
        ref = None
        for lang in english:
            lang = self.convert_stat_name(lang)

            if lang is None:
                continue

            matcher = lang
            # remove prefixes
            if matcher[0] == "+":
                matcher = matcher[1:]

            has_negate = matcher.find("negate") > 0

            if has_negate:
                matcher = matcher[: matcher.find('"')].strip()

            matchers.append({"string": matcher, "negate": has_negate})

            if ref is None:
                ref = lang

        id = id.split(" ")

        for a in id:
            if a == "number_of_additional_arrows":
                matchers.append(
                    {"string": "Bow Attacks fire # additional Arrows", "negate": False}
                )
            self.mod_translations[a] = {
                "ref": ref,
                "matchers": matchers,
            }

    def parse_translation_file(self, file):
        dir = f"{self.cwd}/descriptions/{file}"
        print("Parsing", dir)
        stats_translations = open(dir, encoding="utf-16").read().split("\n")
        for i in range(0, len(stats_translations)):
            line = stats_translations[i]

            if line == "description":
                # start of the translation block
                id = (
                    stats_translations[i + 1].strip()[2:].replace('"', "")
                )  # skip first 2 characters
                english = stats_translations[i + 3].strip()  # skip first 2 characters
                start = english.find('"')
                end = english.rfind('"')
                english = english[start + 1 : end]

                # convert to array so we can add the negated option later on, if one exists
                english = [english]

                negate_english = stats_translations[i + 4].strip()
                if "lang" not in negate_english and "negate" in negate_english:
                    # mod has a negated version
                    end = negate_english.find("negate")
                    negate_english = negate_english[
                        negate_english.find('"') + 1 : end + len("negate")
                    ]
                    english.append(negate_english)

                self.parse_mod(id, english)

    def parse_mods(self):
        for stat in self.stats_file:
            id = stat.get("_index")
            name = stat.get("Id")
            self.stats[id] = name

        # translations
        for file in self.translation_files:
            if os.path.isdir(f"{self.cwd}/descriptions/{file}"):
                # traverse directories if it doesnt start with _
                if not file.startswith("_"):
                    for _file in os.listdir(f"{self.cwd}/descriptions/{file}"):
                        self.parse_translation_file(f"{file}/{_file}")
            elif ".csd" in file:
                self.parse_translation_file(file)

        for mod in self.mods_file:
            id = mod.get("Id")
            stats_key = mod.get("StatsKey1")
            if stats_key is not None:
                stats_id = self.stats.get(stats_key)
                translation = self.mod_translations.get(stats_id)
                if translation:
                    ref = translation.get("ref")
                    matchers = translation.get("matchers")
                    ids = self.stats_trade_ids.get(matchers[0].get("string"))
                    # if ref.lower() == "bow attacks fire an additional arrow":
                    #     print("ID")
                    #     print(f"stats_id: {stats_id}")
                    #     print(f"matchers: {matchers}")
                    #     print(f"ref: {ref}")
                    #     print("break")
                    #     print(f"mod: {mod}")
                    #     print(f"stats_trade_ids: {stats_trade_ids}")
                    #     print(f"ids: {ids}")
                    #     print(f"translation: {translation}")
                    if ids is None and len(matchers) > 1:
                        ids = self.stats_trade_ids.get(matchers[1].get("string"))
                        if ids is None:
                            # print(
                            #     "No trade ids found for",
                            #     matchers[0].get("string"),
                            #     "or",
                            #     matchers[1].get("string"),
                            # )
                            self.matchers_no_trade_ids.append(matchers[0].get("string"))
                            self.matchers_no_trade_ids.append(matchers[1].get("string"))
                    elif ids is None:
                        # print("No trade ids found for", matchers[0].get("string"))
                        self.matchers_no_trade_ids.append(matchers[0].get("string"))
                    trade = {"ids": ids}
                    self.mods[id] = {
                        "ref": translation.get("ref"),
                        "better": 1,
                        "id": stats_id,
                        "matchers": translation.get("matchers"),
                        "trade": trade,
                    }

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

                self.unique_items.append(
                    {
                        "name": name,
                        "refName": name,
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

            class_key = item.get("ItemClassesKey")

            self.items[id] = {
                "name": name,
                "refName": name,
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
            id = gem.get("BaseItemTypesKey")
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
            id = wpn.get("BaseItemTypesKey")

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
        # Changed since db only has once value for each stat
        for armour in self.armour_types:
            id = armour.get("BaseItemTypesKey")

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
                "refName": name,
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

            f.write(json.dumps(out) + "\n")

        for item in self.unique_items:
            f.write(json.dumps(item) + "\n")

        f.close()

        # somehow not a thing? - possibly missing some data
        self.mods["physical_local_damage_+%"] = {
            "ref": "#% increased Physical Damage",
            "better": 1,
            "id": "physical_local_damage_+%",
            "matchers": [{"string": "#% increased Physical Damage"}],
            "trade": {
                "ids": {
                    "explicit": ["explicit.stat_419810844"],
                    "fractured": ["fractured.stat_419810844"],
                    "rune": ["rune.stat_419810844"],
                }
            },
        }

        seen = set()
        m = open(f"{self.out_dir}/stats.ndjson", "w", encoding="utf-8")
        for mod in self.mods.values():
            id = mod.get("id")

            if id in seen:
                continue

            m.write(json.dumps(mod) + "\n")
            seen.add(id)
        m.close()

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang+'-out'}/items_dump.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(json.dumps(self.items, indent=4))

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang+'-out'}/mods_dump.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(json.dumps(self.mods, indent=4))

        with open(
            f"{self.get_script_dir()}/pyDumps/{self.lang+'-out'}/matchers_no_trade_ids.json",
            "w",
            encoding="utf-8",
        ) as f:
            f.write(json.dumps(self.matchers_no_trade_ids, indent=4))

    def run(self):
        self.parse_trade_ids()
        self.parse_mods()
        self.parse_categories()
        self.parse_items()
        self.resolve_item_classes()
        self.parse_trade_exchange_items()
        self.write_to_file()


if __name__ == "__main__":
    Parser().run()
