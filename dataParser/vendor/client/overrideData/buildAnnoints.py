import json
import logging
import os
from pprint import pprint

import pandas as pd

LANG_CODES_TO_NAMES = {
    "en": "English",
    "ru": "Russian",
    "ko": "Korean",
    "cmn-Hant": "Traditional Chinese",
    "ja": "Japanese",
    "de": "German",
    "es": "Spanish",
}
logger = logging.getLogger(__name__)


def get_file_path(base_dir: str, file: str, lang: str, is_en=False):
    return f"{base_dir}{lang if not is_en else 'en'}/{file}.json"


def load_file(base_dir: str, file: str, lang: str, is_en=False):
    path = get_file_path(base_dir, file, lang, is_en)
    logger.info(f"LOADING FILE: ++ {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# Function to load a DataFrame
def load_df(base_dir: str, file: str, lang: str, is_en=False):
    path = get_file_path(base_dir, file, lang, is_en)
    logger.info(f"LOADING FILE: ++ {path}")
    return pd.read_json(path, encoding="utf-8")


class AnnointBuilder:
    def get_script_dir(self):
        """Returns the directory where the script is located."""
        dir = os.path.dirname(os.path.realpath(__file__))
        if dir.endswith("overrideData"):
            return dir[: -len("overrideData")]
        return dir

    def get_file_path(self, file: str, lang: str, is_en=False):
        return f"{self.base_dir}{lang if not is_en else 'en'}/{file}.json"

    def load_file(self, file: str, lang: str, is_en=False):
        path = self.get_file_path(file, lang, is_en)
        logger.info(f"LOADING FILE: ++ {path}")
        return json.loads(
            open(
                path,
                encoding="utf-8",
            ).read()
        )

    def load_df(self, file: str, lang: str, is_en=False):
        path = self.get_file_path(file, lang, is_en)
        logger.info(f"LOADING FILE: ++ {path}")
        return pd.read_json(
            path,
            encoding="utf-8",
        )

    def __init__(self):
        self.cwd = self.get_script_dir()
        self.base_dir = self.cwd + "/tables/"
        # self.out_file = self.cwd + "/overrideData/annoints.json"

    def get_annoints(self, lang: str):
        cwd = self.cwd
        base_dir = self.base_dir
        blight_results = load_df(base_dir, "BlightCraftingResults", lang)
        blight_items = load_df(base_dir, "BlightCraftingItems", lang)
        blight_crafting_recipes = load_df(base_dir, "BlightCraftingRecipes", lang).drop(
            columns=["_index", "Id"]
        )
        passive_skills = load_df(base_dir, "PassiveSkills", lang).drop(
            columns=["_index"]
        )

        joined_results_skills = pd.merge(
            blight_results,
            passive_skills,
            left_on="PassiveSkill",
            right_index=True,
            suffixes=("_results", "_skills"),
        )[["PassiveSkillGraphId", "Name"]]

        joined_results_crafting = pd.merge(
            blight_crafting_recipes,
            joined_results_skills,
            left_on="BlightCraftingResult",
            right_index=True,
            suffixes=("_results", "_crafting"),
        )[["PassiveSkillGraphId", "BlightCraftingItems", "Name"]]

        # def get_tiers(crafting_items, blight_items):
        #     """
        #     Aggregates the 'Tier' from blight_items for each item ID in crafting_items.
        #     It assumes blight_items is indexed by item IDs.
        #     """
        #     return [blight_items.loc[item_id, "Tier"] for item_id in crafting_items]

        # # Apply the function to each row in 'joined_results_crafting'
        # joined_results_crafting["BlightCraftingItems"] = joined_results_crafting.apply(
        #     lambda row: get_tiers(row["BlightCraftingItems"], blight_items), axis=1
        # )

        raw_json_data = {
            group["id"]: group
            for group in json.loads(
                open(f"{cwd}/../json-api/{lang}/stats.json", encoding="utf-8").read()
            )["result"]
        }

        enchants = raw_json_data["enchant"]
        enchants_entries = enchants["entries"]
        enchants_entries_filtered = [
            entry
            for entry in enchants_entries
            if entry["id"].startswith("enchant.stat_2954116742")
        ]
        enchants_df = pd.DataFrame(enchants_entries_filtered)

        enchants_df["value"] = (
            enchants_df["id"].apply(lambda x: x.split("|")[-1]).astype(int)
        )

        output_df = pd.merge(
            joined_results_crafting,
            enchants_df,
            left_on="PassiveSkillGraphId",
            right_on="value",
            suffixes=("_results", "_json"),
        )[["BlightCraftingItems", "Name", "text", "value"]].sort_values(by="value")

        starting_json = {
            "ref": "Allocates #",
            "better": 0,
            "trade": {"ids": {"enchant": ["enchant.stat_2954116742"]}, "option": True},
        }

        def row_to_json(row):
            return {
                "string": row["text"],
                "value": row["value"],
                "oils": ",".join(map(str, row["BlightCraftingItems"])),
            }

        matchers = output_df.apply(lambda row: row_to_json(row), axis=1).to_list()
        starting_json["matchers"] = matchers
        return starting_json


if __name__ == "__main__":
    pprint(AnnointBuilder().get_annoints("en"))
