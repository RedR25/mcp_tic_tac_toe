from typing import List, Optional, Tuple
from enum import Enum

class Player(Enum):
    X = "X"
    O = "O"

class GameState(Enum):
    PLAYING = "playing"
    X_WINS = "x_wins"
    O_WINS = "o_wins"
    DRAW = "draw"

class TicTacToeGame:
    def __init__(self):
        self.board = [["" for _ in range(3)] for _ in range(3)]
        self.current_player = Player.X
        self.state = GameState.PLAYING
        
    def make_move(self, row: int, col: int, player: Player) -> bool:
        if self.state != GameState.PLAYING:
            return False
        if not (0 <= row < 3 and 0 <= col < 3):
            return False
        if self.board[row][col] != "":
            return False
        if player != self.current_player:
            return False
            
        self.board[row][col] = player.value
        self._check_game_state()
        self._switch_player()
        return True
    
    def get_board_state(self) -> List[List[str]]:
        return [row[:] for row in self.board]
    
    def get_available_moves(self) -> List[Tuple[int, int]]:
        moves = []
        for row in range(3):
            for col in range(3):
                if self.board[row][col] == "":
                    moves.append((row, col))
        return moves
    
    def reset(self):
        self.board = [["" for _ in range(3)] for _ in range(3)]
        self.current_player = Player.X
        self.state = GameState.PLAYING
    
    def _check_game_state(self):
        winner = self._check_winner()
        if winner:
            self.state = GameState.X_WINS if winner == Player.X else GameState.O_WINS
        elif not self.get_available_moves():
            self.state = GameState.DRAW
    
    def _check_winner(self) -> Optional[Player]:
        lines = [
            [(0, 0), (0, 1), (0, 2)],
            [(1, 0), (1, 1), (1, 2)],
            [(2, 0), (2, 1), (2, 2)],
            [(0, 0), (1, 0), (2, 0)],
            [(0, 1), (1, 1), (2, 1)],
            [(0, 2), (1, 2), (2, 2)],
            [(0, 0), (1, 1), (2, 2)],
            [(0, 2), (1, 1), (2, 0)]
        ]
        
        for line in lines:
            values = [self.board[r][c] for r, c in line]
            if values[0] != "" and all(v == values[0] for v in values):
                return Player(values[0])
        return None
    
    def _switch_player(self):
        if self.state == GameState.PLAYING:
            self.current_player = Player.O if self.current_player == Player.X else Player.X
    
    def to_string(self) -> str:
        result = []
        for row in self.board:
            result.append(" | ".join(cell if cell else " " for cell in row))
            result.append("-" * 9)
        result.pop()
        result.append(f"Current player: {self.current_player.value}")
        result.append(f"Game state: {self.state.value}")
        return "\n".join(result)