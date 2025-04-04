import pandas as pd


def get_df(json_file: dict) -> pd.DataFrame:
    return pd.DataFrame(json_file)


def build_runes_df(
    base_items: pd.DataFrame, stats: pd.DataFrame, runes: pd.DataFrame
) -> pd.DataFrame:
    def replace_indices_with_ids(index_list, stats_df):
        return [stats_df.loc[i, "Id"] for i in index_list]

    runes["StatsArmour"] = runes["StatsArmour"].apply(
        lambda lst: replace_indices_with_ids(lst, stats)
    )
    runes["StatsWeapon"] = runes["StatsWeapon"].apply(
        lambda lst: replace_indices_with_ids(lst, stats)
    )
    runes_merged = runes.merge(
        base_items, left_on="BaseItemType", right_index=True, how="left"
    )[
        [
            "BaseItemType",
            "StatsWeapon",
            "StatsValuesWeapon",
            "StatsArmour",
            "StatsValuesArmour",
        ]
    ]

    return runes_merged
