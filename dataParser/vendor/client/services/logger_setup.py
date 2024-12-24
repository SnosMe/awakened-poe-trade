# logger_setup.py
import logging

# Initial logging configuration
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


def set_log_level(level):
    """Set the logging level."""
    logger.setLevel(level)
    logging.getLogger().setLevel(level)  # Applies to all loggers
    logger.info(f"Log level set to: {level}")
