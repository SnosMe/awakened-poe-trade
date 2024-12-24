import logging
import os
import re

logger = logging.getLogger(__name__)


def convert_stat_name(stat: str) -> str | None:
    logger.debug(f"Converting stat name: {stat}")
    original_stat = stat
    stat = stat.strip()

    iteration_count = 0
    iteration_limit = 25  # Prevent infinite loops

    # Main loop to resolve brackets
    while iteration_count < iteration_limit:
        iteration_count += 1

        open_square_bracket = stat.find("[")
        close_square_bracket = stat.find("]")

        # Check for valid brackets
        if open_square_bracket == -1 and close_square_bracket == -1:
            logger.debug("No more brackets found, breaking out of loop.")
            break

        if (
            close_square_bracket < open_square_bracket
            or close_square_bracket == -1
            or open_square_bracket == -1
        ):
            logger.warning(
                f"Mismatched brackets found, {open_square_bracket} and {close_square_bracket}"
            )
            logger.warning(f"Original stat: {original_stat}")
            logger.debug("Attempting to recover from mismatched brackets.")
            # Skip the unmatched closing bracket
            stat = try_recover_brackets(stat, open_square_bracket, close_square_bracket)
            if stat is None:
                logger.warning("Failed to recover from mismatched brackets.")
                return None
            continue

        logger.debug(f"Current stat before resolving brackets: {stat}")
        logger.debug(
            f"Open bracket at: {open_square_bracket}, Close bracket at: {close_square_bracket}"
        )

        # Resolve brackets
        key = stat[open_square_bracket + 1 : close_square_bracket]

        if "|" in key:  # key|value pair
            key = key.split("|")[1]  # use value
            logger.debug(f"Using key from key|value pair: {key}")

        stat = stat[:open_square_bracket] + key + stat[close_square_bracket + 1 :]

        logger.debug(f"Stat after replacement: {stat}")

    if iteration_count >= iteration_limit:
        logger.error("Exceeded maximum iterations in while loop, Skipping stat.")
        logger.error(f"Original stat: {original_stat}")
        return None

    logger.debug("No more brackets found, proceeding to replace matches.")

    pattern = re.compile(r"{\d+}")
    for match in pattern.findall(stat):
        logger.debug(f"Replacing match: {match} with '#' in stat: {stat}")
        stat = stat.replace(match, "#")

    stat = stat.replace("{0:+d}", "+#")

    if len(stat) == 0:
        logger.warning("Converted stat name is empty, returning None.")
        return None

    if stat[0] == "{" and stat[1] == "}":
        stat = "#" + stat[2:]

    logger.debug(f"Final converted stat name: {stat}")
    return stat


def try_recover_brackets(
    stat: str, open_square_bracket: int, close_square_bracket: int
) -> str | None:
    """Attempt to recover from mismatched brackets."""
    if open_square_bracket == -1:
        logger.debug("No opening bracket found. Attempting to recover.")
        # No opening bracket to match, return the original string
        return try_fix_missing_opening_bracket(stat, close_square_bracket)

    elif close_square_bracket == -1:
        logger.debug("No closing bracket found. Attempting to recover.")
        # No closing bracket to process, return the original string
        return try_fix_missing_closing_bracket(stat, open_square_bracket)

    elif close_square_bracket < open_square_bracket:
        logger.warning("Unmatched closing bracket found. Attempting to recover.")
        # Skip the unmatched closing bracket
        return try_fix_unmatched_closing_bracket(
            stat, open_square_bracket, close_square_bracket
        )

    return stat


def try_fix_unmatched_closing_bracket(
    stat: str, open_square_bracket: int, close_square_bracket: int
) -> str | None:
    """Attempt to fix an unmatched closing bracket."""
    left_of_bracket = stat[:close_square_bracket]
    dropped_bracket_stat = (
        stat[:close_square_bracket] + stat[close_square_bracket + 1 :]
    )

    find_pipe = left_of_bracket.rfind("|")

    if find_pipe == -1:
        # Case 1: drop unmatched right bracket
        logger.debug("Dropping unmatched right bracket.")
        return dropped_bracket_stat
    else:
        # Case 2: keep localized drop everything left of pipe to next space (including pipe)
        logger.debug("Keeping localized name.")
        pipe = dropped_bracket_stat.find("|")
        space_left_of_pipe = dropped_bracket_stat[:pipe].rfind(" ")
        return (
            dropped_bracket_stat[: space_left_of_pipe + 1]
            + dropped_bracket_stat[pipe + 1 :]
        )


def try_fix_missing_opening_bracket(stat: str, close_square_bracket: int) -> str | None:
    """Attempt to fix a missing opening bracket."""
    assert close_square_bracket != -1
    return try_fix_unmatched_closing_bracket(stat, 0, close_square_bracket)


def try_fix_missing_closing_bracket(stat: str, open_square_bracket: int) -> str | None:
    """Attempt to fix a missing closing bracket."""
    assert open_square_bracket != -1
    # remove everything between and including the opening and rightmost pipe, assuming no left bracket in between
    pipe = stat.find("|", open_square_bracket)
    if pipe == -1:
        return None
    next_left_bracket = stat.find("[", open_square_bracket + 1)
    if next_left_bracket != -1 and next_left_bracket < pipe:
        # there is a left bracket in between, so we need to keep the pipe
        return None
    return stat[:open_square_bracket] + stat[pipe + 1 :]


if __name__ == "__main__":
    # Test functionality
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    test_stat = "ステージ獲得間隔\nステージの最大数@[0}秒\n{1}"
    logger.debug(f"Test stat: {test_stat}")
    converted = convert_stat_name(test_stat)
    logger.debug(f"Converted stat: {converted}")
