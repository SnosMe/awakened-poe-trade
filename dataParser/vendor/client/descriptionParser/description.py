import logging
import os
from collections import defaultdict
from pprint import pprint

from services.statNameBuilder import convert_stat_name

logger = logging.getLogger(__name__)

FLIP_NEGATE_IDS = {
    # "local_attribute_requirements_+%",
    "flask_charges_used_+%",
    "charm_charges_used_+%",
}
NEGATE_FOR_EN = {
    "local_attribute_requirements_+%",
}


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

    def simplify_block(
        self, block: list[str]
    ) -> tuple[str, list[tuple[str, str, str | None]]]:
        lang = self.extract_lang(block[0])
        lines = block[2:]
        # TODO: Parse for more complex line sets
        # pos_line = lines[0].strip()
        # out_lines = [pos_line[pos_line.find('"') + 1 : pos_line.rfind('"')]]
        out_lines = []

        # if len(lines) > 1:
        #     neg_line = lines[1].strip()
        #     if "lang" not in neg_line and "negate" in neg_line:
        #         # mod has a negated version
        #         end = neg_line.find("negate")
        #         neg_line = neg_line[neg_line.find('"') + 1 : end + len("negate")]
        #         out_lines.append(neg_line)

        for line in lines:
            line = line.strip()
            left_quote = line.find('"')
            right_quote = line.rfind('"')
            if left_quote != -1 and right_quote != -1:
                left_side = line[:left_quote].strip()
                out_line = line[left_quote + 1 : right_quote].strip()
                right_side = None
                if right_quote + 1 < len(line):
                    right_side = line[right_quote + 1 :].strip()
                out_lines.append((left_side, out_line, right_side))

        logger.debug(f"Simplified block for lang: {lang}, lines: {out_lines}")
        return lang, out_lines

    def extract_lang(self, line: str) -> str:
        line = line.strip()
        if not line.startswith("lang"):
            return "English"
        return line[line.find('"') + 1 : line.rfind('"')]

    def get_matchers(
        self, lines: list[tuple[str, str, str | None]], is_en: bool
    ) -> list[dict[str, str | bool]]:
        """
        Generate matchers from the parsed lines.
        Each line is a tuple (left_side, out_line, right_side).
        Negation is determined by the presence of 'negate' in right_side.
        Groups matchers by 'string' and aggregates other fields into sets.
        """
        logger.debug("Getting matchers.")
        temp_matchers = []

        for left_side, out_line, right_side in lines:
            # Use `out_line` as the main part of the stat to convert
            stat_name = convert_stat_name(out_line)
            if stat_name is None:
                logger.warning(
                    f"Stat name could not be converted. Skipping line: {out_line}"
                )
                continue

            matcher = stat_name

            # Remove prefixes
            if matcher[0] == "+":
                matcher = matcher[1:]

            # Detect negations based on presence of "negate" in `right_side`
            has_negate = "negate" in (right_side or "")

            # Replace "+#" with "#"
            if "+#" in matcher:
                matcher = matcher.replace("+#", "#")

            # Append the matcher
            temp_matchers.append(
                {
                    "string": matcher,
                    "negate": has_negate,
                    "left_side": left_side.strip(),  # Include left metadata for context
                    "right_side": right_side.strip()
                    if right_side
                    else None,  # Optional right metadata
                    "stat_name": stat_name,
                }
            )

            # # Set the English reference if applicable
            # if is_en and self.english_ref is None:
            #     self.english_ref = stat_name

        # Group matchers by 'string' and aggregate other fields
        grouped_matchers = defaultdict(
            lambda: {
                "negate": set(),
                "left_side": set(),
                "right_side": set(),
                "stat_name": set(),
            }
        )
        for matcher in temp_matchers:
            string_value = matcher["string"]
            grouped_matchers[string_value]["negate"].add(matcher["negate"])
            grouped_matchers[string_value]["left_side"].add(matcher["left_side"])
            if matcher["right_side"]:
                grouped_matchers[string_value]["right_side"].add(matcher["right_side"])
            grouped_matchers[string_value]["stat_name"].add(matcher["stat_name"])

        # Format grouped matchers into the final output
        matchers = []
        for string_value, data in grouped_matchers.items():
            negate = any(data["negate"])
            left_side = [str(x).split(" ")[0] for x in data["left_side"]]
            right_side = list(data["right_side"])

            # Determine the value based on specific rules
            value = None
            if "#|-100" in left_side:
                value = -1
            elif "100|#" in left_side:
                value = 100
            else:
                for item in left_side:
                    if item.isdigit():  # Check if `item` is a number
                        value = int(item)
                        break

            if value is None and not negate and is_en and self.english_ref is None:
                self.english_ref = data["stat_name"].pop()

            # if value is None and is_en and self.english_ref is None:
            #     if self.id in NEGATE_FOR_EN:
            #         if negate:
            #             self.english_ref = data["stat_name"].pop()
            #     elif not negate:
            #         self.english_ref = data["stat_name"].pop()

            if self.id in FLIP_NEGATE_IDS:
                negate = not negate

            matcher_data = {
                "string": string_value,
                "negate": negate,
            }
            if value is not None:
                matcher_data["value"] = value

            matchers.append(matcher_data)

        if is_en:
            logger.info(f"Final matchers: {matchers}")
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
    desc = Description(lines, lang="English")

    print(desc.english_ref)
