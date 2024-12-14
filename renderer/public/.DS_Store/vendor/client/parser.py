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
import os
import json
import re
import requests
import urllib.parse

def get_script_dir():
    """Returns the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__))

cwd = get_script_dir()
base_dir =  cwd +  "/tables/"
out_dir = cwd + "/pyDumps/en"


def load_file(file):
    return json.loads(open(f"{base_dir}/{file}.json").read())

base_items              = load_file("BaseItemTypes")
item_classes            = load_file("ItemClasses")
item_class_categories   = load_file("ItemClassCategories")
armour_types            = load_file("ArmourTypes")
weapon_types            = load_file("WeaponTypes")
skill_gems              = load_file("SkillGems")
skill_gem_info          = load_file("SkillGemInfo")
stats_file              = load_file("Stats")
translation_files       = os.listdir(f"{cwd}/descriptions")
mods_file               = load_file("Mods")
trade_stats             = json.loads(open(f"{cwd}/../json-api/stats.json").read()) # content of https://www.pathofexile.com/api/trade2/data/stats
trade_items             = json.loads(open(f"{cwd}/../json-api/items.json").read()) # content of https://www.pathofexile.com/api/trade2/data/items
trade_exchange_items    = json.loads(open(f"{cwd}/../json-api/static.json").read()) # content of https://www.pathofexile.com/api/trade2/data/static

items = {}
unique_items = []
parsed_item_class_categories = {}
parsed_item_classes = {}
stats = {}
stats_trade_ids = {}
mod_translations = {}
mods = {}

def make_poe_cdn_url(path):
    return urllib.parse.urljoin('https://web.poecdn.com/', path)

def convert_stat_name(stat):
    stat = stat.strip()
    open_square_bracket = stat.find("[")
    close_square_bracket = stat.find("]")
    
    while open_square_bracket >= 0 and close_square_bracket > 0:
        # resolve brackets, this can be either the plain text or a key|value pair
        key = stat[open_square_bracket + 1:close_square_bracket]

        if "|" in key: # key|value pair
            key = key.split("|")[1] # use value
        stat = stat[:open_square_bracket] + key + stat[close_square_bracket + 1:]
            
        open_square_bracket = stat.find("[")
        close_square_bracket = stat.find("]")
        
    pattern = re.compile(r'{\d+}')
    for match in pattern.findall(stat):
        stat = stat.replace(match, "#")

    stat = stat.replace("{0:+d}", "+#")
    
    if len(stat) == 0:
        return None
    
    if stat[0] == "{" and stat[1] == "}":
        stat = "#" + stat[2:]
        
    return stat

def parse_trade_ids():
    for res in trade_stats["result"]:
        for entry in res.get("entries"):
            id = entry.get("id")
            text = entry.get("text")
            type = entry.get("type")
            text = convert_stat_name(text)
            
            if text not in stats_trade_ids:
                stats_trade_ids[text] = {}
                
            if type not in stats_trade_ids[text]:
                stats_trade_ids[text][type] = []
            
            stats_trade_ids[text][type].append(id)

def parse_mod(id, english):
    matchers = []
    ref = None
    for lang in english:
        raw = lang
        lang = convert_stat_name(lang)
        
        if lang == None:
            continue
                
        matcher = lang
        # remove prefixs
        if matcher[0] == "+":
            matcher = matcher[1:]

        has_negate = matcher.find("negate") > 0
        
        if has_negate:
            matcher = matcher[:matcher.find('"')].strip()

        matchers.append({
            "string": matcher,
            "negate": has_negate
        })
        
        if ref == None:
            ref = lang
        
    id = id.split(" ")
    
    for a in id:
        mod_translations[a] = {
            "ref": ref,
            "matchers": matchers,
        }

def parse_translation_file(file):
    dir = f"{cwd}/descriptions/{file}"
    print("Parsing", dir)
    stats_translations = open(dir, encoding="utf-16").read().split("\n")
    for i in range(0, len(stats_translations)):
        line = stats_translations[i]

        if line == "description":
            # start of the translation block
            id = stats_translations[i + 1].strip()[2:].replace('"', "") # skip first 2 characters
            english = stats_translations[i + 3].strip() # skip first 2 characters
            start = english.find('"')
            end = english.rfind('"')
            english = english[start + 1: end]
            
            # convert to array so we can add the negated option later on, if one exists
            english = [english]
            
            negate_english = stats_translations[i + 4].strip()
            if "lang" not in negate_english and "negate" in negate_english:
                # mod has a negated version
                end = negate_english.find('negate')
                negate_english = negate_english[negate_english.find('"') + 1:end + len('negate')]
                english.append(negate_english)
                
            parse_mod(id, english)

def parse_mods():
    for stat in stats_file:
        id = stat.get("_index")
        name = stat.get("Id")
        stats[id] = name   
    
    # translations
    for file in translation_files:
        if os.path.isdir(f"{cwd}/descriptions/{file}"):
            # traverse directories if it doesnt start with _
            if not file.startswith("_"):
                for _file in os.listdir(f"{cwd}/descriptions/{file}"):
                    parse_translation_file(f"{file}/{_file}")
        elif ".csd" in file:
            parse_translation_file(file)
            
    for mod in mods_file:
        id = mod.get("Id")
        stats_key = mod.get("StatsKey1")
        if stats_key != None:
            stats_id = stats.get(stats_key)
            translation = mod_translations.get(stats_id)
            if translation:
                ref = translation.get("ref")
                matchers = translation.get("matchers")
                ids = stats_trade_ids.get(matchers[0].get("string"))
                if ids == None and len(matchers) > 1:
                    ids = stats_trade_ids.get(matchers[1].get("string"))
                    if ids == None:
                        print("No trade ids found for", matchers[0].get("string"), "or", matchers[1].get("string"))
                trade = {"ids": ids}
                mods[id] = {
                    "ref": translation.get("ref"),
                    "better": 1,
                    "id": stats_id,
                    "matchers": translation.get("matchers"),
                    "trade": trade
                }

def parse_categories():
    # parse item categories
    for cat in item_class_categories:
        id = cat.get("_index")
        if id is None:
            continue
        
        text = cat.get("Id")
        parsed_item_class_categories[id] = text    

    for cat in item_classes:
        id = cat.get("_index")
        if id is None:
            continue
        
        text = cat.get("Id")
        parsed_item_classes[id] = {
            "name": text,
            "short": parsed_item_class_categories.get(cat.get("ItemClassCategory"))
        }    

def parse_items():
    
    for entry in trade_items["result"]:
        for item in entry.get("entries"):
            name = item.get("name")
            if name == None:
                continue
            text = item.get("text")
            type = item.get("type")
            # unique item
            flags = item.get("flags")
            
            unique_items.append({
                "name": name,
                "refName": name,
                "namespace": "UNIQUE",
                "unique": {
                    "base": type
                }
            })

    # parse base items
    for item in base_items:
        id = item.get("_index")
        if id is None:
            continue
        
        name = item.get("Name")
        
        if len(name) == 0:
            continue
        
        class_key = item.get("ItemClassesKey")
        
        items[id] = {
            "name": name,
            "refName": name,
            "namespace": "ITEM",
            "class": class_key,
            "dropLevel": item.get("DropLevel"),
            "width": item.get("Width"),
            "height": item.get("Height"),
        }
        
        if class_key is not None:
            class_info = parsed_item_classes.get(class_key).get("short")
            # if class_info in ["Belt", "Ring", "Amulet"]:
            if class_info != None:
                items[id].update({
                    "craftable": {
                        "category": class_info
                    }
                })

    # convert base items into gems
    for gem in skill_gems:
        id = gem.get("BaseItemTypesKey")
        if id in items:
            items[id].update({
                "namespace": "GEM",
                "gem": {
                    "awakened": False,
                    "transfigured": False
                }
            })
        
    # weapons and armor need the craftable tag ("craftable": "type (helmet, boots etc)")
    # convert base items into weapons
    for wpn in weapon_types:
        id = wpn.get("BaseItemTypesKey")
        
        if id in items:
            class_key = items[id].get("class")
            items[id].update({
                "craftable": {
                    "category": parsed_item_classes.get(class_key).get("short"),
                }
            })

    # convert base items into armor types
    # armour needs the armour tag ("armour": "ar": [min, max], "ev": [min, max], "es": [min, max])
    # Changed since db only has once value for each stat
    for armour in armour_types:
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
        
        if id in items:
            items[id].update({ 
                "armour": armour
            })

def parse_trade_exchange_items():
    items_ids = {}
    for id, item in items.items():
        items_ids[item.get("name")] = id

    for category in trade_exchange_items["result"]:
        for entry in category.get("entries"):
            item_name = entry.get("text")

            if not item_name in items_ids:
                continue

            items[items_ids[item_name]].update({
                "tradeTag": entry.get("id"),
                "icon": make_poe_cdn_url(entry.get("image"))
            })
def resolve_item_classes():
    for item_class in item_classes:
        id = item_class.get("_index")
        if id is None:
            continue
        
        name = item_class.get("Name")
        item_class_category = item_class.get("ItemClassCategory")
        
        if id in items:
            items[id].update({
                "class": name,
                "category": parsed_item_classes.get(item_class_category)
            })

def write_to_file():
    f = open(f"{out_dir}/items.ndjson", "w", encoding="utf-8")
    items_name = sorted(items.values(), key=lambda x: x.get("name"))
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
             out.update({
                "tradeTag": tradeTag
            })
        
        if craftable:
            out.update({
                "craftable": craftable
            })
            
        if armour:
            out.update({
                "armour": armour
            })
            
        if width:
            out.update({
                "w": width
            })
            
        if height:
            out.update({
                "h": height
            })
            
        if gem:
            out.update({
                "gem": gem
            })
        
        f.write(json.dumps(out) + "\n")
        
    for item in unique_items:
        f.write(json.dumps(item) + "\n")
        
    f.close()
    
    # somehow not a thing? - possibly missing some data
    mods["physical_local_damage_+%"] = {
        "ref": "#% increased Physical Damage", "better": 1, "id": "physical_local_damage_+%", "matchers": [{"string": "#% increased Physical Damage"}], "trade": {"ids": {"explicit": ["explicit.stat_419810844"], "fractured": ["fractured.stat_419810844"], "rune": ["rune.stat_419810844"]}}
    }
    
    seen = set()
    m = open(f"{out_dir}/stats.ndjson", "w", encoding="utf-8")
    for mod in mods.values():
        id = mod.get("id")
        
        if id in seen:
            continue
        
        m.write(json.dumps(mod) + "\n")
        seen.add(id)
    m.close()
    
    with open(f"{get_script_dir()}/pyDumps/items_dump.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(items, indent=4))
    
    with open(f"{get_script_dir()}/pyDumps/mods_dump.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(mods, indent=4))

if __name__ == "__main__":
    parse_trade_ids()
    parse_mods()
    parse_categories()
    parse_items()
    resolve_item_classes()
    parse_trade_exchange_items()
    write_to_file()

