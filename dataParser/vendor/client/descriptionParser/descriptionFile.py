import json
import logging
import os

from descriptionParser.description import Description

logger = logging.getLogger(__name__)


def get_script_dir():
    """Returns the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__))


class DescriptionFile:
    def __init__(self, filePath, encoding="utf-16", lang="English"):
        self.filePath = filePath
        self.encoding = encoding
        self.lang = lang

        logger.debug(
            f"Initializing DescriptionFile with path: {filePath}, encoding: {encoding}, lang: {lang}"
        )

        fileLines = self.load(self.filePath)
        blocks = self.split_into_description_blocks(fileLines)

        self.descriptions = [Description(block, lang=self.lang) for block in blocks]
        self.descriptions_lookup = {d.id: d for d in self.descriptions}

        logger.debug(f"Loaded {len(self.descriptions)} descriptions.")
        logger.debug(f"Loading overwrites for {self.lang}")
        overwrites = self.load_overwrites()
        if self.lang in overwrites:
            self.overwrites = overwrites[self.lang]
            for desc in self.descriptions:
                if desc.id in self.overwrites:
                    desc.data = self.overwrites[desc.id]
        manual_additions = self.load_manual_additions()
        if self.lang in manual_additions:
            self.manual_additions = manual_additions[self.lang]
            for id, matcher in self.manual_additions.items():
                self.descriptions.append(
                    Description([], lang=self.lang, manual={"id": id, "data": matcher})
                )

    def __str__(self):
        return f"DescriptionFile(descriptions={self.descriptions})"

    def load(self, filePath: str) -> list[str]:
        logger.debug(f"Loading file: {filePath} with encoding: {self.encoding}")

        with open(filePath, "r", encoding=self.encoding) as f:
            lines = f.readlines()

        logger.debug(f"Loaded {len(lines)} lines from the file.")

        # trim up until the first description block
        while not lines[0].startswith("description"):
            logger.debug("Removing line as it does not start with 'description'.")
            lines.pop(0)

        return lines

    def split_into_description_blocks(self, lines: list[str]) -> list[list[str]]:
        logger.debug("Splitting lines into description blocks.")

        blocks = [[]]

        for i in range(len(lines)):
            if lines[i].startswith("description"):
                if len(blocks) > 0 and len(blocks[-1]) > 0 and blocks[-1][-1] == "\n":
                    # remove last empty line
                    blocks[-1].pop()
                    logger.debug(
                        f"Removed last empty line from block {len(blocks) - 1}."
                    )
                blocks.append([])

            blocks[-1].append(lines[i])

        if len(blocks[-1]) > 0 and blocks[-1][-1] == "\n":
            # remove last empty line
            blocks[-1].pop()
            logger.debug("Removed last empty line from the final block.")

        if len(blocks[0]) == 0:
            blocks.pop(0)

        logger.debug(f"Created {len(blocks)} blocks of descriptions.")
        return blocks

    def load_overwrites(self):
        overwrites_file_path = f"{get_script_dir()}/overwrites.json"
        with open(overwrites_file_path, "r", encoding="utf-8") as overwrites_file:
            return json.loads(overwrites_file.read())

    def load_manual_additions(self):
        manual_additions_file_path = f"{get_script_dir()}/manual-additions.json"
        with open(
            manual_additions_file_path, "r", encoding="utf-8"
        ) as manual_additions_file:
            return json.loads(manual_additions_file.read())
