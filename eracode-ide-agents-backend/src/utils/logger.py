import logging
import sys
from datetime import datetime

# Configure logging format
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def setup_logger(name: str = "eracode-agents", level: int = logging.INFO) -> logging.Logger:
    """Setup and return a configured logger"""
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Formatter
    formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)
    console_handler.setFormatter(formatter)
    
    # Add handler
    logger.addHandler(console_handler)
    
    return logger

# Create default logger
logger = setup_logger()

# Convenience functions
def info(msg: str):
    logger.info(msg)

def debug(msg: str):
    logger.debug(msg)

def warning(msg: str):
    logger.warning(msg)

def error(msg: str):
    logger.error(msg)

def critical(msg: str):
    logger.critical(msg)
