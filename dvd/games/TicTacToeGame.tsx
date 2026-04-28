import React, { useState, useEffect } from 'react';
import WinModal from '../WinModal';

type Player = 'X' | 'O' | null;

const Square: React.FC<{ value: Player; onClick: () => void }> = ({ value, onClick }) => (
  <button 
    className={`w-24 h-24 md:w-32 md:h-32 bg-slate-800/70 flex items-center justify-center text-5xl md:text-7xl font-bold transition-colors duration-200
      ${value === 'X' ? 'text-lime-400' : 'text-cyan-400'}
      hover:bg-slate-700`}
    onClick={onClick}
  >
    {value}
  </button>
);

const TicTacToeGame: React.FC = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [showWinModal, setShowWinModal] = useState(false);
  
  const winner = calculateWinner(board);
  const isDraw = board.every(Boolean) && !winner;

  useEffect(() => {
    if (winner || isDraw) {
      setTimeout(() => setShowWinModal(true), 300);
    }
  }, [winner, isDraw]);

  const handleClick = (i: number) => {
    if (winner || board[i]) {
      return;
    }
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  const handlePlayAgain = () => {
    resetGame();
    setShowWinModal(false);
  };

  const getStatus = () => {
    if (winner) {
      return `Winner: ${winner}`;
    }
    if (isDraw) {
      return 'Draw!';
    }
    return `Next player: ${xIsNext ? 'X' : 'O'}`;
  };

  const getStatusColor = () => {
      if (winner === 'X') return 'text-lime-400 animate-pulse';
      if (winner === 'O') return 'text-cyan-400 animate-pulse';
      if (isDraw) return 'text-green-400 animate-pulse';
      return 'text-slate-300';
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4">
      <div className="text-center mb-8 pt-16">
        <p className={`text-3xl font-semibold transition-colors duration-300 ${getStatusColor()}`}>
          {getStatus()}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 bg-cyan-900/70 p-2 rounded-xl shadow-lg border-2 border-slate-700">
        {board.map((_, i) => (
          <Square key={i} value={board[i]} onClick={() => handleClick(i)} />
        ))}
      </div>
      {showWinModal && (
        <WinModal
          onPlayAgain={handlePlayAgain}
          onClose={() => setShowWinModal(false)}
          title={winner ? `Player ${winner} Wins!` : "It's a Draw!"}
          message={winner ? "Excellent move!" : "Good game!"}
        />
      )}
    </div>
  );
};

function calculateWinner(squares: Player[]): Player {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export default TicTacToeGame;
