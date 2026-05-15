export type FeedType = "top" | "new" | "best" | "ask" | "show" | "jobs";

export interface HNItem {
  id: number;
  type: "job" | "story" | "comment" | "poll" | "pollopt";
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  deleted?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface FavMeta { note: string; tags: string[]; savedAt: string; }

export interface NoteRecord {
  itemId: number;
  itemType: "story" | "comment";
  itemTitle: string;   // story title, or stripped comment excerpt
  storyId: number;     // for stories: same as itemId; for comments: parent story id
  storyTitle: string;  // for stories: same as itemTitle; for comments: story title
  body: string;
  updatedAt: string;
}

export interface HNUser {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
}

export interface WordRule {
  id: number;
  find: string;
  replace: string;
}

export const FEED_ENDPOINTS: Record<FeedType, string> = {
  top: "topstories",
  new: "newstories",
  best: "beststories",
  ask: "askstories",
  show: "showstories",
  jobs: "jobstories",
};
