import logging
import os
from pprint import pprint

from services.statNameBuilder import convert_stat_name

logger = logging.getLogger(__name__)


class Description:
    english_ref = None

    def __init__(
        self, lines: list[str], lang="English", log_level=logging.FATAL, manual=None
    ):
        self.lang = lang
        if manual is not None:
            self.id = manual["id"]
            self.data = manual["data"]
            return

        logger.debug(f"Initializing Description with lang: {lang}")

        if not lines[0].startswith("description"):
            logger.error("Invalid description block.")
            raise ValueError("Invalid description block")

        self.id = self.parse_id(lines)
        logger.debug(f"Parsed ID: {self.id}")

        self.data = self.parse_lines(lines, self.id)

    def __str__(self):
        return f"Description(id={self.id}, english_ref={self.english_ref})"

    def parse_id(self, lines: list[str]) -> str:
        assert lines[0].startswith("description")
        line = lines[1].strip()
        logger.debug(f"Parsing ID from line: {line}")
        return line.strip()[2:].replace('"', "")

    def parse_lines(self, lines: list[str], id: str) -> dict:
        assert lines[0].startswith("description")
        sanitized_lines = self.sanitize_lines(lines)
        logger.debug(f"Sanitized lines: {sanitized_lines}")

        blocks = self.parse_blocks(sanitized_lines)
        lang_blocks = [self.simplify_block(block) for block in blocks]

        # Create the lang_dict
        lang_dict = {
            lang: self.get_matchers(mod_lines, lang == "English")
            for lang, mod_lines in lang_blocks
        }

        logger.debug(f"Language dictionary created: {lang_dict}")

        # Filter lang_dict for only English and self.lang
        # filtered_lang_dict = {
        #     lang: matchers
        #     for lang, matchers in lang_dict.items()
        #     if lang in ["English", self.lang]
        # }

        # logger.debug(f"Filtered language dictionary: {filtered_lang_dict}")
        return lang_dict

    def sanitize_lines(self, lines: list[str]) -> list[str]:
        logger.debug(f"Sanitizing lines: {lines}")
        return [line.strip() for line in lines[1:]]

    def parse_blocks(self, lines: list[str]) -> list[list[str]]:
        logger.debug("Parsing lines into blocks.")
        blocks = [[]]

        for i in range(len(lines)):
            if lines[i].startswith("lang"):
                blocks.append([])
            blocks[-1].append(lines[i])

        logger.debug(f"Created {len(blocks)} blocks.")
        return blocks

    def simplify_block(self, block: list[str]) -> tuple[str, list[str]]:
        lang = self.extract_lang(block[0])
        lines = block[2:]
        # TODO: Parse for more complex line sets
        pos_line = lines[0].strip()
        out_lines = [pos_line[pos_line.find('"') + 1 : pos_line.rfind('"')]]

        if len(lines) > 1:
            neg_line = lines[1].strip()
            if "lang" not in neg_line and "negate" in neg_line:
                # mod has a negated version
                end = neg_line.find("negate")
                neg_line = neg_line[neg_line.find('"') + 1 : end + len("negate")]
                out_lines.append(neg_line)

        logger.debug(f"Simplified block for lang: {lang}, lines: {out_lines}")
        return lang, out_lines

    def extract_lang(self, line: str) -> str:
        line = line.strip()
        if not line.startswith("lang"):
            return "English"
        return line[line.find('"') + 1 : line.rfind('"')]

    def get_matchers(
        self, lines: list[str], is_en: bool
    ) -> list[dict[str, str | bool]]:
        logger.debug("Getting matchers.")
        matchers = []
        for line in lines:
            stat_name = convert_stat_name(line)
            if stat_name is None:
                logger.warning("Stat name could not be converted. Skipping line.")
                continue
            matcher = stat_name

            # remove prefixes
            if matcher[0] == "+":
                matcher = matcher[1:]
            has_negate = matcher.find("negate") > 0
            if has_negate:
                matcher = matcher[: matcher.find('"')].strip()

            if "+#" in matcher:
                matcher = matcher.replace("+#", "#")

            matchers.append({"string": matcher, "negate": has_negate})
            if is_en and self.english_ref is None:
                self.english_ref = stat_name

        logger.debug(f"Matchers found: {matchers}")
        return matchers


if __name__ == "__main__":
    # Test functionality
    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/singleDesc.csd",
        "r",
        encoding="utf-8",
    ) as f:
        lines = f.readlines()
    logger.debug(f"Loaded lines for testing: {lines}")
    desc = Description(lines, lang="Korean")

    print(desc.english_ref)
