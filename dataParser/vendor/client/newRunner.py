import os
from pprint import pprint

from descriptionParser.description import Description
from descriptionParser.descriptionFile import DescriptionFile

if __name__ == "__main__":
    # Test functionality
    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/descriptionParser/singleDesc.csd",
        "r",
        encoding="utf-8",
    ) as f:
        lines = f.readlines()
    desc = Description(lines)

    pprint(desc.data)
    print(desc.english_ref)
    print(desc.id)

    other_desc = DescriptionFile(
        f"{os.path.dirname(os.path.realpath(__file__))}/descriptionParser/fewDesc.csd",
        encoding="utf-8",
    )
