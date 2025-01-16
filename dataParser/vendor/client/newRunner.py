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

    pprint(desc.data["English"])
    print(desc.english_ref)
    print(desc.id)

    other_desc = DescriptionFile(
        f"{os.path.dirname(os.path.realpath(__file__))}/descriptionParser/fewDesc.csd",
        encoding="utf-8",
    )

    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/descriptionParser/manyLineDesc.csd",
        "r",
        encoding="utf-8",
    ) as f:
        lines2 = f.readlines()
    desc2 = Description(lines2)

    pprint(desc2.data["English"])
    print(desc2.english_ref)
    print(desc2.id)

    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/descriptionParser/arrowDesc.csd",
        "r",
        encoding="utf-8",
    ) as f:
        lines3 = f.readlines()
    desc3 = Description(lines3)

    pprint(desc3.data["English"])
    print(desc3.english_ref)
    print(desc3.id)
