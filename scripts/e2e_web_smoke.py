"""Play through the rendered game using the browser UI.

Run against a static Expo web export, for example:
  python3 -m http.server 4173 --directory /tmp/nexus-crush-e2e-web
  python3 scripts/e2e_web_smoke.py

The script intentionally discovers the current board from accessible tile labels
and calculates a legal adjacent swap before interacting with the app.
"""

from __future__ import annotations

import re
from typing import Dict, Iterable, Tuple

from playwright.sync_api import Page, sync_playwright


BOARD_SIZE = 8
Position = Tuple[int, int]
Board = Dict[Position, str]


def tile_locator(page: Page, position: Position):
    row, column = position
    return page.get_by_role("button", name=re.compile(rf"tile at row {row}, column {column}$")).first


def adjacent_pairs() -> Iterable[Tuple[Position, Position]]:
    for row in range(1, BOARD_SIZE + 1):
        for column in range(1, BOARD_SIZE + 1):
            current = (row, column)
            if column < BOARD_SIZE:
                yield current, (row, column + 1)
            if row < BOARD_SIZE:
                yield current, (row + 1, column)


def read_board(page: Page) -> Board:
    board: Board = {}
    for button in page.get_by_role("button").all():
        label = button.get_attribute("aria-label") or ""
        match = re.match(r"(.+) tile at row (\d+), column (\d+)$", label)
        if match:
            board[(int(match.group(2)), int(match.group(3)))] = match.group(1)
    assert len(board) == BOARD_SIZE * BOARD_SIZE, f"expected 64 tiles, found {len(board)}"
    return board


def has_match(board: Board) -> bool:
    for row in range(1, BOARD_SIZE + 1):
        for column in range(1, BOARD_SIZE - 1):
            if board[(row, column)] == board[(row, column + 1)] == board[(row, column + 2)]:
                return True
    for column in range(1, BOARD_SIZE + 1):
        for row in range(1, BOARD_SIZE - 1):
            if board[(row, column)] == board[(row + 1, column)] == board[(row + 2, column)]:
                return True
    return False


def is_valid_swap(board: Board, first: Position, second: Position) -> bool:
    candidate = dict(board)
    candidate[first], candidate[second] = candidate[second], candidate[first]
    return has_match(candidate)


def find_pair(board: Board, valid: bool) -> Tuple[Position, Position]:
    for first, second in adjacent_pairs():
        if is_valid_swap(board, first, second) is valid:
            return first, second
    raise AssertionError(f"could not find a {'valid' if valid else 'invalid'} swap")


def read_score(page: Page) -> int:
    return int((page.get_by_test_id("score-card").inner_text()).replace(",", ""))


def read_moves(page: Page) -> int:
    return int(page.get_by_test_id("moves-card").inner_text())


def play_pair(page: Page, pair: Tuple[Position, Position], wait_ms: int = 560) -> None:
    tile_locator(page, pair[0]).click()
    tile_locator(page, pair[1]).click()
    page.wait_for_timeout(wait_ms)


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto("http://localhost:4173")
        page.wait_for_load_state("networkidle")

        assert page.get_by_text("Sugar Circuit", exact=True).is_visible()
        assert page.get_by_text("MAKE A CHAIN", exact=True).is_visible()
        assert len(read_board(page)) == BOARD_SIZE * BOARD_SIZE
        assert read_score(page) == 0
        assert read_moves(page) == 24

        invalid_pair = find_pair(read_board(page), valid=False)
        play_pair(page, invalid_pair, wait_ms=380)
        assert read_score(page) == 0
        assert read_moves(page) == 24
        assert "No chain" in page.get_by_test_id("status-message").inner_text()
        print(f"invalid swap preserved score=0 moves=24 pair={invalid_pair}")

        valid_pair = find_pair(read_board(page), valid=True)
        play_pair(page, valid_pair)
        assert read_score(page) > 0
        assert read_moves(page) == 23
        print(
            "valid swap resolved "
            f"pair={valid_pair} score={read_score(page)} moves={read_moves(page)} "
            f"status={page.get_by_test_id('status-message').inner_text()}"
        )
        page.screenshot(path="/tmp/nexus-crush-chain-success.png", full_page=True)

        # Continue using legal moves until the configured game-over condition appears.
        while page.get_by_test_id("restart-button").count() == 0:
            if read_moves(page) == 0:
                break
            pair = find_pair(read_board(page), valid=True)
            play_pair(page, pair)

        assert page.get_by_test_id("restart-button").is_visible()
        assert page.get_by_test_id("final-score").is_visible()
        print(f"game over final_score={page.get_by_test_id('final-score').inner_text()}")

        page.get_by_test_id("restart-button").click()
        page.wait_for_timeout(250)
        assert read_score(page) == 0
        assert read_moves(page) == 24
        assert page.get_by_test_id("restart-button").count() == 0
        page.screenshot(path="/tmp/nexus-crush-e2e-final.png", full_page=True)
        print("restart reset score=0 moves=24")
        browser.close()


if __name__ == "__main__":
    main()
