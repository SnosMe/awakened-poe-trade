import logging
from parser import Parser

from services.logger_setup import logger, set_log_level

SUPPORTED_LANGUAGES = ["en", "ru", "ko", "cmn-Hant", "ja", "de", "es"]


if __name__ == "__main__":
    logger.info("Starting parser")
    set_log_level(logging.WARNING)
    logger.critical(
        "This parser is deprecated and is not being maintained. It may not work as expected."
    )
    for lang in SUPPORTED_LANGUAGES:
        logger.info(f"Generating {lang} tables")
        parser = Parser(lang)
        parser.run()

    logger.critical(
        "This parser is deprecated and is not being maintained. It may not work as expected."
    )
