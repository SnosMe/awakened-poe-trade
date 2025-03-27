import logging
import math
from collections import defaultdict
from datetime import datetime
from time import sleep
from typing import Optional

import cloudscraper
from requests.models import CaseInsensitiveDict, Response

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


class RateLimitError(Exception):
    pass


class RateLimit:
    def __init__(self, limit: int, window: int, penalty: int):
        self.max = limit
        self.window = window
        self.penalty = penalty

    def __str__(self):
        return (
            f"RateLimiter<max={self.max}:window={self.window}:penalty={self.penalty}>"
        )

    def __repr__(self):
        return (
            f"RateLimiter<max={self.max}:window={self.window}:penalty={self.penalty}>"
        )

    def __eq__(self, other):
        if not isinstance(other, RateLimit):
            return False
        return (
            self.max == other.max
            and self.window == other.window
            and self.penalty == other.penalty
        )


class RateLimiter:
    def __init__(self, debug=False):
        self.limits = defaultdict()
        self.session = cloudscraper.create_scraper(interpreter="nodejs", debug=debug)

    def wait(self, duration: int | float):
        """Wait for a specified duration.

        Parameters
        ----------
        duration : int | float
            The duration to wait in seconds.
        """
        assert isinstance(duration, int) or isinstance(duration, float)
        assert duration > 0
        sleep(duration)

    def parse_window_limit(self, window: str) -> RateLimit:
        """Takes a string in the format "limit:interval:penalty" and returns a RateLimit object.

        Parameters
        ----------
        window : str
            The string to parse.

        Returns
        -------
        RateLimit
            The parsed RateLimit object.
        """
        assert isinstance(window, str)
        split_window = window.split(":")
        assert len(split_window) == 3
        return RateLimit(
            int(split_window[0]),
            int(split_window[1]),
            int(split_window[2]),
        )

    def parse_rate_limit(self, limit: str) -> list[RateLimit]:
        """Takes a csv string of rate limits and returns a list of RateLimit objects.

        Parameters
        ----------
        limit : str
            csv string of rate limits

        Returns
        -------
        list[RateLimit]
            The parsed list of RateLimit objects.
        """
        assert isinstance(limit, str)
        split_limit = limit.split(",")
        windows = []
        for window in split_limit:
            windows.append(self.parse_window_limit(window))
        return windows

    def get_limits(self, limit: str, state: str) -> list[tuple[RateLimit, RateLimit]]:
        """Takes a group of rate limits and the current state of rate limits from the server and returns a paired list of RateLimit objects.

        Parameters
        ----------
        limit : str
            csv of rate limits
        state : str
            csv of the limits but with the current state according to the server

        Returns
        -------
        list[tuple[RateLimit, RateLimit]]
            The paired list of RateLimit objects. The first element in the tuple is the limit and the second element is the state.
        """
        assert isinstance(limit, str)
        assert isinstance(state, str)
        # limits follow format: "limit:interval:penalty"
        limits = self.parse_rate_limit(limit)
        assert isinstance(limits, list)
        assert len(limits) > 0
        assert isinstance(limits[0], RateLimit)
        states = self.parse_rate_limit(state)
        assert isinstance(states, list)
        assert len(states) > 0
        assert isinstance(states[0], RateLimit)

        limit_groups = []
        for limit_group, state_group in zip(limits, states):
            assert limit_group.window == state_group.window
            limit_groups.append((limit_group, state_group))
        return limit_groups

    def wait_if_exceeded(self, limit: RateLimit, state: RateLimit):
        """Waits using time.sleep if the server says we are on a penalty currently. Will wait for the FULL penalty, not just what the server says is remaining.

        Parameters
        ----------
        limit : RateLimit
            A specific period limit
        state : RateLimit
            The current state of the limit
        """
        assert isinstance(limit, RateLimit)
        assert isinstance(state, RateLimit)
        assert isinstance(state.penalty, int)
        assert isinstance(limit.penalty, int)
        # If the server says we are on penalty
        if state.penalty > 0:
            # Wait for the full penalty
            self.wait(limit.penalty)
            # It should be safe to assume this will never occur, and thus should raise an error
            # Since waiting though, we will just log an error
            logger.error(
                f"Rate limit exceeded. Waiting for full penalty of {limit.penalty} seconds. RateLimit: {limit}, State: {state}"
            )

    def wait_if_needed(self, limit: RateLimit, state: RateLimit, policy: str):
        assert isinstance(limit, RateLimit)
        assert isinstance(state, RateLimit)
        assert isinstance(policy, str)

        # If we are less than 1.2x the average rate since last update, wait for 1.1x the average rate
        average_request_rate = limit.window / limit.max * 2
        last_update = self.limits.get(policy, {}).get("last_update")
        assert isinstance(last_update, datetime)
        time_since_last_update = (datetime.now() - last_update).total_seconds()
        if time_since_last_update <= average_request_rate * 1.5:
            # Should almost always happen for limit with the longest average request rate
            logger.debug(f"Waiting for {average_request_rate * 1.4} | {limit}, {state}")
            self.wait(average_request_rate * 1.4)

        # If we are close to exceeding this limit, wait 3x the average rate
        if state.max >= math.floor(limit.max * 0.9):
            logger.warning(
                f"Close to exceeding limit, waiting for {average_request_rate * 3} | {limit}, {state}"
            )
            self.wait(average_request_rate * 3)

    def wait_limit(self, policy: str, rules: str, limit: str, state: str):
        assert isinstance(policy, str)
        assert isinstance(rules, str)
        assert isinstance(limit, str)
        assert isinstance(state, str)
        rate_limits = self.get_limits(limit, state)
        self.limits[policy] = {
            "policy": policy,
            "rules": rules,
            "limit": limit,
            "state": state,
            "rate_limits": rate_limits,
            "last_update": datetime.now(),
            "prev_state": self.limits.get(policy, {}).get("state"),
            "prev_rate_limits": self.limits.get(policy, {}).get("rate_limits"),
        }
        rate_limits.reverse()
        for limit, state in rate_limits:
            self.wait_if_exceeded(limit, state)
            self.wait_if_needed(limit, state, policy)
        logger.debug(f"Current rate limits: {self.limits}")

    def handle_headers(self, headers: dict[str, str], status_code: int):
        """Handles the headers returned from the server."""
        assert isinstance(headers, CaseInsensitiveDict)
        assert isinstance(status_code, int)
        if status_code == 429:
            logger.error("Rate limit exceeded.")
            retry_after = headers.get("Retry-After")
            if retry_after:
                logger.error(f"Retry after: {retry_after}")
                self.wait(int(retry_after))
            else:
                logger.error("No retry after header found.")

        ac_headers = headers.get("access-control-expose-headers")
        if isinstance(ac_headers, str):
            ac_headers = ac_headers.lower()
            if (
                "x-rate-limit-policy" in ac_headers
                and "x-rate-limit-rules" in ac_headers
                and "x-rate-limit-ip" in ac_headers
                and "x-rate-limit-ip-state" in ac_headers
            ):
                self.wait_limit(
                    headers.get("x-rate-limit-policy"),
                    headers.get("x-rate-limit-rules"),
                    headers.get("x-rate-limit-ip"),
                    headers.get("x-rate-limit-ip-state"),
                )
        else:
            logger.error("No access-control-expose-headers header found.")

    def get(
        self,
        url: str,
        payload: Optional[dict[str, str]] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> Response:
        response = self.session.get(url, json=payload, headers=headers)
        self.handle_headers(response.headers, response.status_code)
        return response

    def post(
        self,
        url: str,
        payload: Optional[dict[str, str]] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> Response:
        response = self.session.post(url, json=payload, headers=headers)
        self.handle_headers(response.headers, response.status_code)
        return response
