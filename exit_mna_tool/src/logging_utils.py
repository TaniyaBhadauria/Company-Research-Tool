from __future__ import annotations

from rich.console import Console
from rich.logging import RichHandler
import logging

console = Console()

def get_logger(name: str = "exit_mna") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)
    handler = RichHandler(console=console, show_time=True, show_level=True, show_path=False)
    formatter = logging.Formatter("%(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger
