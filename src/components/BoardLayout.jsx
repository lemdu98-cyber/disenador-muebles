import Board from "./Board";

export default function BoardLayout({ boards }) {
  return <div className="board-list">{boards.map((board) => <Board key={board.number} board={board} />)}</div>;
}
