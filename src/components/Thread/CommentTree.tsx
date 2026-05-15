import { useTheme } from "../../theme";
import { useItem } from "../../hooks/useItem";
import { CommentNode } from "./CommentNode";

interface CommentTreeProps {
  topLevelIds: number[] | undefined;
  votes: Record<number, number>;
  onVote: (id: number, delta: number) => void;
}

export function CommentTree({ topLevelIds, votes, onVote }: CommentTreeProps) {
  if (!topLevelIds || topLevelIds.length === 0) return null;
  return (
    <div>
      {topLevelIds.map(id => <TopLevelComment key={id} id={id} votes={votes} onVote={onVote}/>)}
    </div>
  );
}

function TopLevelComment({ id, votes, onVote }: { id: number; votes: Record<number, number>; onVote: (id: number, delta: number) => void }) {
  const t = useTheme();
  const { data: comment } = useItem(id);
  if (!comment) return <div style={{ marginTop: 18, height: 40, background: t.surfaceAlt, borderRadius: 6, opacity: 0.4 }}/>;
  return <CommentNode comment={comment} depth={0} votes={votes} onVote={onVote}/>;
}
