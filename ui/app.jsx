// Cervantes — root app
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

function App({ tweaks, setTweak }) {
  const t = tweaks;

  // density / font scale
  const baseTheme = THEMES[t.dark ? "dark" : "light"];
  const theme = useMemoA(() => ({
    ...baseTheme,
    accent: t.accent || baseTheme.accent,
  }), [baseTheme, t.accent]);

  const [section, setSection] = useStateA("top");
  const [selectedId, setSelectedId] = useStateA(41006);
  const [favTag, setFavTag] = useStateA(null);
  const [search, setSearch] = useStateA("");

  const [favorites, setFavorites] = useStateA(() => {
    const m = new Set();
    for (const s of STORIES) if (s.favorite) m.add(s.id);
    return m;
  });
  const [favMeta, setFavMeta] = useStateA(() => {
    const o = {};
    for (const s of STORIES) {
      if (s.favorite) {
        o[s.id] = {
          note: s.note || "",
          tags: s.id === 41008 ? ["deep-dive"] :
                s.id === 41003 ? ["read-later"] :
                s.id === 41001 ? ["tools","deep-dive"] : ["saved"],
          savedAt: "yesterday",
        };
      }
    }
    return o;
  });
  const [votes, setVotes] = useStateA({});

  const toggleFav = (id) => {
    const wasFav = favorites.has(id);
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setFavMeta(prev => {
      if (wasFav) {
        const c = { ...prev }; delete c[id]; return c;
      }
      return { ...prev, [id]: prev[id] || { note: "", tags: ["saved"], savedAt: "just now" } };
    });
  };
  const updateFavNote = (id, note) =>
    setFavMeta(p => ({ ...p, [id]: { ...(p[id] || { tags: ["saved"] }), note } }));
  const updateFavTag = (id, tag) => setFavMeta(p => {
    const cur = p[id] || { note: "", tags: [], savedAt: "just now" };
    const has = (cur.tags || []).includes(tag);
    const tags = has ? cur.tags.filter(x => x !== tag) : [...(cur.tags || []), tag];
    return { ...p, [id]: { ...cur, tags } };
  });
  const vote = (id, delta) => setVotes(p => ({ ...p, [id]: (p[id] || 0) + delta }));

  const filtered = useMemoA(() => {
    let list = STORIES;
    if (favTag) {
      list = list.filter(s => favorites.has(s.id));
      if (favTag !== "all") list = list.filter(s => (favMeta[s.id]?.tags || []).includes(favTag));
    } else {
      if (section === "ask")  list = list.filter(s => s.type === "ask");
      else if (section === "show") list = list.filter(s => s.type === "show");
      else if (section === "jobs") list = list.filter(s => s.type === "job");
      else if (section === "new")  list = [...list].sort((a,b) => parseInt(a.time) - parseInt(b.time));
      else if (section === "best") list = [...list].sort((a,b) => b.points - a.points);
      else list = list.filter(s => s.type !== "job");
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q) || (s.by || "").toLowerCase().includes(q));
    }
    return list;
  }, [section, favTag, search, favorites, favMeta]);

  useEffectA(() => {
    if (filtered.length && !filtered.find(s => s.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered]);

  const selectedStory = STORIES.find(s => s.id === selectedId);
  const comments = COMMENTS[selectedId] || FALLBACK_COMMENTS;

  const title = favTag
    ? (favTag === "all" ? "All saved" : (FAVORITE_TAGS.find(x => x.id === favTag)?.label || "Saved"))
    : (SECTIONS.find(s => s.id === section)?.label || "Top");
  const subtitle = favTag
    ? `${filtered.length} favorited stories`
    : (SECTIONS.find(s => s.id === section)?.hint || "");

  useEffectA(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const idx = filtered.findIndex(s => s.id === selectedId);
      if (e.key === "j" && idx < filtered.length - 1) { setSelectedId(filtered[idx+1].id); e.preventDefault(); }
      else if (e.key === "k" && idx > 0)             { setSelectedId(filtered[idx-1].id); e.preventDefault(); }
      else if (e.key === "f" && selectedStory)       { toggleFav(selectedStory.id); }
      else if (e.key === "d")                        { setTweak("dark", !t.dark); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, selectedId, t.dark]);

  return (
    <Desktop t={theme}>
      <Sidebar
        t={theme}
        section={section} onSection={setSection}
        favTag={favTag} onFavTag={setFavTag}
        favCount={favorites.size}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        <Toolbar
          t={theme}
          title={title}
          subtitle={subtitle}
          dark={t.dark}
          onToggleDark={() => setTweak("dark", !t.dark)}
          search={search}
          onSearch={setSearch}
          right={
            <IconButton t={theme} tip="Submit a story">
              <Icon name="plus" color={theme.ink} size={13}/>
              <span style={{ fontFamily: SERIF, fontSize: 13 }}>Submit</span>
            </IconButton>
          }
        />
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <StoryList
            t={theme} stories={filtered}
            selectedId={selectedId} onSelect={setSelectedId}
            favorites={favorites} onToggleFav={toggleFav}
            favoriteMeta={favMeta}
          />
          <Reader
            t={theme} story={selectedStory} comments={comments}
            isFav={selectedStory ? favorites.has(selectedStory.id) : false}
            favMeta={selectedStory ? favMeta[selectedStory.id] : null}
            onToggleFav={() => selectedStory && toggleFav(selectedStory.id)}
            onUpdateFavNote={updateFavNote}
            onUpdateFavTag={updateFavTag}
            onPostComment={() => {}}
            votes={votes} onVote={vote}
          />
        </div>
      </div>
    </Desktop>
  );
}

function Desktop({ t, children }) {
  const wall = t.bg === "#1B1814"
    ? "radial-gradient(ellipse at 30% 0%, #2A2418, #110F0B 70%)"
    : "radial-gradient(ellipse at 30% 0%, #D6C8A7, #B9A883 70%)";

  // Fixed-size inner window, scaled to fit viewport
  const INNER_W = 1320, INNER_H = 840;
  const [scale, setScale] = useStateA(1);
  useEffectA(() => {
    const fit = () => {
      const pad = 32;
      const sx = (window.innerWidth - pad*2) / INNER_W;
      const sy = (window.innerHeight - pad*2) / INNER_H;
      setScale(Math.min(1, sx, sy));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", minHeight: 480,
      background: wall, boxSizing: "border-box", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: SERIF, color: t.ink,
    }}>
      <div style={{
        width: INNER_W, height: INNER_H,
        transform: `scale(${scale})`, transformOrigin: "center center",
        flexShrink: 0,
      }}>
        <div style={{
          width: "100%", height: "100%",
          borderRadius: 12, overflow: "hidden", background: t.bg,
          boxShadow: t.bg === "#1B1814"
            ? "0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px rgba(0,0,0,0.6)"
            : "0 0 0 1px rgba(0,0,0,0.12), 0 24px 80px rgba(0,0,0,0.30)",
          display: "flex", flexDirection: "column",
          position: "relative",
        }}>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Root() {
  const [tweaks, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  return (
    <>
      <App tweaks={tweaks} setTweak={setTweak}/>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance"/>
        <TweakToggle label="Dark mode" value={tweaks.dark} onChange={v => setTweak("dark", v)}/>
        <TweakColor label="Accent" value={tweaks.accent} onChange={v => setTweak("accent", v)}
          options={["#B85D2E", "#9D6B2F", "#4A6B43", "#5F5C8C", "#8B3A3A"]}/>
        <TweakSection label="Reading"/>
        <TweakSlider label="Font scale" value={tweaks.fontScale} min={0.85} max={1.25} step={0.05}
          onChange={v => setTweak("fontScale", v)}/>
        <TweakRadio label="Density" value={tweaks.density}
          options={["compact","comfy"]}
          onChange={v => setTweak("density", v)}/>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root/>);
