// Cervantes — reader pane (story header + comment tree + composer)
const { useState: useState3, useMemo: useMemo3 } = React;

function Reader({ t, story, comments, isFav, favMeta, onToggleFav, onUpdateFavNote, onUpdateFavTag, onPostComment, votes, onVote }) {
  if (!story) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: t.bg, color: t.muted, gap: 12,
      }}>
        <div style={{
          fontFamily: SERIF, fontSize: 22, fontStyle: "italic", color: t.mutedSoft,
        }}>Pick a story.</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: t.mutedSoft, letterSpacing: 0.5 }}>
          j / k to navigate · f to favorite · o to open
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, height: "100%", overflowY: "auto",
      background: t.bg,
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 48px 80px" }}>
        <StoryHeader t={t} story={story} isFav={isFav} favMeta={favMeta}
          onToggleFav={onToggleFav} onUpdateFavNote={onUpdateFavNote}
          onUpdateFavTag={onUpdateFavTag} votes={votes} onVote={onVote}/>

        <CommentComposer t={t} onPost={onPostComment}/>

        <div style={{
          margin: "32px 0 16px", display: "flex", alignItems: "baseline", gap: 10,
          borderBottom: `1px solid ${t.rule}`, paddingBottom: 10,
        }}>
          <h3 style={{
            margin: 0, fontFamily: SERIF, fontSize: 15, fontWeight: 600,
            color: t.ink, letterSpacing: -0.1,
          }}>{story.descendants} comments</h3>
          <span style={{ flex: 1 }}/>
          <SortMenu t={t}/>
        </div>

        <CommentTree t={t} comments={comments} votes={votes} onVote={onVote}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function StoryHeader({ t, story, isFav, favMeta, onToggleFav, onUpdateFavNote, onUpdateFavTag, votes, onVote }) {
  const [editingNote, setEditingNote] = useState3(false);
  const [draftNote, setDraftNote] = useState3(favMeta?.note || "");
  const domain = story.url ? story.url.split("/")[0] : null;
  const liveVotes = (votes[story.id] || 0);
  const userVoted = liveVotes > 0;
  const total = story.points + liveVotes;

  return (
    <div>
      {/* category badge */}
      <div style={{ marginBottom: 12 }}>
        {story.type === "ask" && <Tag t={t} kind="ask">Ask HN</Tag>}
        {story.type === "show" && <Tag t={t} kind="show">Show HN</Tag>}
        {story.type === "job" && <Tag t={t} kind="job">Hiring</Tag>}
      </div>

      {/* title */}
      <h1 style={{
        margin: 0, fontFamily: SERIF, fontSize: 30, lineHeight: 1.2,
        fontWeight: 600, letterSpacing: -0.5, color: t.ink, textWrap: "balance",
      }}>{story.title}</h1>

      {/* byline */}
      <div style={{
        marginTop: 12, fontFamily: MONO, fontSize: 11, color: t.muted,
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
        letterSpacing: 0.2,
      }}>
        <span style={{ color: t.inkSoft }}>by {story.by}</span>
        <span>{story.time} ago</span>
        {domain && (
          <a href="#" onClick={e => e.preventDefault()}
            style={{
              color: t.accent, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 4,
              borderBottom: `1px dashed ${t.accent}`, paddingBottom: 1,
            }}>
            <Icon name="link" size={11} color={t.accent}/>{domain}
          </a>
        )}
      </div>

      {/* actions row */}
      <div style={{
        marginTop: 22, display: "flex", alignItems: "center", gap: 8,
        paddingTop: 16, borderTop: `1px solid ${t.rule}`,
      }}>
        <button
          onClick={() => onVote(story.id, userVoted ? -1 : 1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 6,
            border: `1px solid ${userVoted ? t.accent : t.rule}`,
            background: userVoted ? t.accentSoft : "transparent",
            color: userVoted ? t.accent : t.ink,
            fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
          <Icon name="arrow-up" size={13} color={userVoted ? t.accent : t.ink}/>
          {total} points
        </button>
        <button
          onClick={onToggleFav}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 6,
            border: `1px solid ${isFav ? t.accent : t.rule}`,
            background: isFav ? t.accentSoft : "transparent",
            color: isFav ? t.accent : t.ink,
            fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
          <Icon name={isFav ? "star-fill" : "star"} size={13} color={isFav ? t.accent : t.ink}/>
          {isFav ? "Favorited" : "Favorite"}
        </button>
        <button style={btnGhost(t)}>
          <Icon name="link" size={13} color={t.ink}/> Open source
        </button>
        <button style={btnGhost(t)}>
          <Icon name="chat" size={13} color={t.ink}/> Reply
        </button>
        <div style={{ flex: 1 }}/>
        <button style={btnGhost(t)}>
          <Icon name="more" size={13} color={t.ink}/>
        </button>
      </div>

      {/* favorite drawer */}
      {isFav && (
        <div style={{
          marginTop: 16, padding: "14px 16px",
          background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 8,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
          }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: t.muted, letterSpacing: 0.5,
              textTransform: "uppercase",
            }}>Saved to</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FAVORITE_TAGS.map(tg => {
                const active = (favMeta?.tags || []).includes(tg.id);
                return (
                  <button
                    key={tg.id}
                    onClick={() => onUpdateFavTag(story.id, tg.id)}
                    style={{
                      padding: "3px 9px", borderRadius: 999,
                      border: `1px solid ${active ? t.accent : t.rule}`,
                      background: active ? t.accentSoft : "transparent",
                      color: active ? t.accent : t.muted,
                      fontFamily: SERIF, fontSize: 12, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                    {active && <Icon name="check" size={10} color={t.accent}/>}
                    {tg.label}
                  </button>
                );
              })}
            </div>
          </div>
          {!editingNote ? (
            <div
              onClick={() => { setDraftNote(favMeta?.note || ""); setEditingNote(true); }}
              style={{
                fontFamily: SERIF, fontSize: 14, color: favMeta?.note ? t.ink : t.muted,
                fontStyle: favMeta?.note ? "italic" : "normal",
                cursor: "text", lineHeight: 1.45, minHeight: 22,
              }}>
              {favMeta?.note ? `“${favMeta.note}”` : "Add a note for future you…"}
            </div>
          ) : (
            <div>
              <textarea
                autoFocus
                value={draftNote}
                onChange={e => setDraftNote(e.target.value)}
                placeholder="Why are you saving this?"
                style={{
                  width: "100%", border: `1px solid ${t.rule}`, outline: "none",
                  background: t.bg, color: t.ink, borderRadius: 6, padding: 10,
                  fontFamily: SERIF, fontSize: 14, lineHeight: 1.5,
                  resize: "vertical", minHeight: 60,
                }}/>
              <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button style={btnGhost(t)} onClick={() => setEditingNote(false)}>Cancel</button>
                <button style={btnPrimary(t)} onClick={() => { onUpdateFavNote(story.id, draftNote); setEditingNote(false); }}>Save note</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* link preview */}
      {domain && (
        <a href="#" onClick={e => e.preventDefault()} style={{
          display: "block", marginTop: 18, padding: "14px 16px",
          border: `1px solid ${t.rule}`, borderRadius: 8,
          background: t.surface, textDecoration: "none", color: "inherit",
        }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.4, textTransform: "uppercase" }}>
            Linked source
          </div>
          <div style={{
            marginTop: 4, fontFamily: SERIF, fontSize: 14, color: t.ink, fontWeight: 500,
          }}>{story.url}</div>
          <div style={{
            marginTop: 4, fontFamily: SERIF, fontSize: 13, color: t.muted, fontStyle: "italic",
          }}>Click to open in browser ↗</div>
        </a>
      )}

      {/* For Ask HN — body */}
      {story.type === "ask" && (
        <div style={{
          marginTop: 22, padding: "0 0 0 16px",
          borderLeft: `2px solid ${t.rule}`,
          fontFamily: SERIF, fontSize: 16, lineHeight: 1.65, color: t.inkSoft,
        }}>
          The most interesting bugs are usually the ones that shouldn't be possible.
          What did you find this year that genuinely surprised you — a race condition
          hiding behind a comment, a silent integer truncation, a hardware quirk
          nobody documented? I'll start in the comments.
        </div>
      )}
    </div>
  );
}

function btnGhost(t) {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 12px", borderRadius: 6,
    border: `1px solid ${t.rule}`, background: "transparent",
    color: t.ink, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer",
  };
}
function btnPrimary(t) {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 14px", borderRadius: 6,
    border: `1px solid ${t.accent}`, background: t.accent,
    color: "#FBF6E9", fontFamily: SERIF, fontSize: 13, fontWeight: 600, cursor: "pointer",
  };
}

// ─────────────────────────────────────────────────────────────
function SortMenu({ t }) {
  const [val, setVal] = useState3("best");
  const opts = [["best","Best"],["new","Newest"],["old","Oldest"]];
  return (
    <div style={{ display: "flex", gap: 0, border: `1px solid ${t.rule}`, borderRadius: 5, overflow: "hidden" }}>
      {opts.map(([k, l]) => (
        <button key={k} onClick={() => setVal(k)} style={{
          padding: "4px 10px", border: "none", cursor: "pointer",
          background: val === k ? t.surfaceAlt : "transparent",
          color: val === k ? t.ink : t.muted,
          fontFamily: SERIF, fontSize: 12, fontWeight: val === k ? 600 : 400,
        }}>{l}</button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function CommentComposer({ t, onPost }) {
  const [text, setText] = useState3("");
  const [focused, setFocused] = useState3(false);
  const filled = text.trim().length > 0;
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{
        border: `1px solid ${focused ? t.accent : t.rule}`,
        background: t.surface, borderRadius: 8, padding: "10px 12px",
        transition: "border-color .15s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 4, background: t.accentSoft,
            color: t.accent, fontFamily: SERIF, fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>P</div>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.3 }}>
            commenting as <span style={{ color: t.inkSoft }}>polaris_data</span>
          </span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Add to the conversation. Markdown supported."
          style={{
            width: "100%", border: "none", outline: "none",
            background: "transparent", color: t.ink,
            fontFamily: SERIF, fontSize: 15, lineHeight: 1.55,
            resize: "vertical", minHeight: focused || filled ? 90 : 38,
            transition: "min-height .15s",
          }}/>
        {(focused || filled) && (
          <div style={{
            marginTop: 8, display: "flex", alignItems: "center", gap: 8,
            paddingTop: 8, borderTop: `1px solid ${t.rule}`,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft }}>
              **bold**  *italic*  `code`  &gt; quote
            </span>
            <div style={{ flex: 1 }}/>
            <button style={btnGhost(t)} onClick={() => setText("")}>Discard</button>
            <button
              style={{ ...btnPrimary(t), opacity: filled ? 1 : 0.5, cursor: filled ? "pointer" : "default" }}
              disabled={!filled}
              onClick={() => { onPost(text); setText(""); }}>
              Post comment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function CommentTree({ t, comments, votes, onVote }) {
  return (
    <div>
      {comments.map(c => <CommentNode key={c.id} t={t} c={c} depth={0} votes={votes} onVote={onVote}/>)}
    </div>
  );
}

function CommentNode({ t, c, depth, votes, onVote }) {
  const [collapsed, setCollapsed] = useState3(false);
  const [replying, setReplying] = useState3(false);
  const v = votes[c.id] || 0;
  const voted = v > 0;
  const score = c.points + v;
  return (
    <div style={{ marginTop: depth === 0 ? 18 : 12 }}>
      <div style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        paddingLeft: depth > 0 ? 0 : 0,
      }}>
        {/* gutter — author + vote */}
        <div style={{
          width: 22, flexShrink: 0, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4, paddingTop: 2,
        }}>
          <button onClick={() => onVote(c.id, voted ? -1 : 1)}
            title={voted ? "Unvote" : "Upvote"}
            style={{
              border: "none", background: "transparent", cursor: "pointer",
              color: voted ? t.accent : t.mutedSoft, padding: 1,
            }}>
            <Icon name="arrow-up" size={14} color={voted ? t.accent : t.muted}/>
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 1, flex: 1, background: t.rule, border: "none",
              cursor: "pointer", minHeight: 20, padding: 0,
            }}
            title="Collapse thread"
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* header */}
          <div style={{
            display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap",
            fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.2,
          }}>
            <span style={{
              fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: t.ink,
              letterSpacing: 0,
            }}>{c.by}</span>
            <span>{score} points</span>
            <span>{c.time} ago</span>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                color: t.muted, fontFamily: MONO, fontSize: 10.5, padding: 0,
              }}>
              [{collapsed ? `+${countAll(c)}` : "−"}]
            </button>
          </div>

          {!collapsed && (
            <>
              <div style={{
                marginTop: 6, fontFamily: SERIF, fontSize: 15,
                lineHeight: 1.6, color: t.inkSoft, textWrap: "pretty",
              }}>{c.text}</div>

              <div style={{
                marginTop: 6, display: "flex", gap: 14,
                fontFamily: MONO, fontSize: 10.5, color: t.mutedSoft,
              }}>
                <button onClick={() => setReplying(!replying)} style={linkBtn(t)}>
                  reply
                </button>
                <button style={linkBtn(t)}>share</button>
                <button style={linkBtn(t)}>flag</button>
              </div>

              {replying && (
                <div style={{
                  marginTop: 10, border: `1px solid ${t.accent}`, borderRadius: 6,
                  background: t.surface, padding: 10,
                }}>
                  <textarea
                    autoFocus
                    placeholder={`Reply to ${c.by}…`}
                    style={{
                      width: "100%", border: "none", outline: "none",
                      background: "transparent", color: t.ink,
                      fontFamily: SERIF, fontSize: 14, lineHeight: 1.5,
                      resize: "vertical", minHeight: 60,
                    }}/>
                  <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button style={btnGhost(t)} onClick={() => setReplying(false)}>Cancel</button>
                    <button style={btnPrimary(t)} onClick={() => setReplying(false)}>Reply</button>
                  </div>
                </div>
              )}

              {c.children?.length > 0 && (
                <div style={{
                  marginTop: 6, paddingLeft: 4,
                  borderLeft: `1px solid ${t.rule}`,
                  marginLeft: -8,
                  paddingLeft: 14,
                }}>
                  {c.children.map(child => (
                    <CommentNode key={child.id} t={t} c={child} depth={depth+1} votes={votes} onVote={onVote}/>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function countAll(c) {
  let n = 1;
  for (const ch of (c.children || [])) n += countAll(ch);
  return n - 1; // children only
}

function linkBtn(t) {
  return {
    border: "none", background: "transparent", cursor: "pointer",
    color: t.muted, padding: 0,
    fontFamily: MONO, fontSize: 10.5, letterSpacing: 0.3,
    textDecoration: "underline", textUnderlineOffset: 2,
    textDecorationColor: t.mutedSoft,
  };
}

Object.assign(window, { Reader, StoryHeader, CommentComposer, CommentTree });
