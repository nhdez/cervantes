interface IconProps { name: string; size?: number; color?: string; }

export function Icon({ name, size = 14, color = "currentColor" }: IconProps) {
  const s = size;
  const stroke = { stroke: color, strokeWidth: 1.5, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "star":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 2.5l1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5l3.8-.5L8 2.5z"/></svg>;
    case "star-fill": return <svg width={s} height={s} viewBox="0 0 16 16"><path fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" d="M8 2.5l1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5l3.8-.5L8 2.5z"/></svg>;
    case "arrow-up":  return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 12V4M4.5 7.5L8 4l3.5 3.5"/></svg>;
    case "chat":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 4h10v7H7l-3 2.5V11H3z"/></svg>;
    case "link":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M9.5 6.5l-3 3M6.5 4.5l-2 2a2.5 2.5 0 003.5 3.5l1-1M9.5 11.5l2-2a2.5 2.5 0 00-3.5-3.5l-1 1"/></svg>;
    case "sun":       return <svg width={s} height={s} viewBox="0 0 16 16"><circle {...stroke} cx="8" cy="8" r="2.5"/><path {...stroke} d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>;
    case "moon":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M13 9.5A5 5 0 016.5 3a5.5 5.5 0 1 0 6.5 6.5z"/></svg>;
    case "search":    return <svg width={s} height={s} viewBox="0 0 16 16"><circle {...stroke} cx="7" cy="7" r="4"/><path {...stroke} d="M10 10l3 3"/></svg>;
    case "plus":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 3v10M3 8h10"/></svg>;
    case "back":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M10 3L5 8l5 5"/></svg>;
    case "tag":       return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 3h5l5 5-5 5-5-5V3z"/><circle cx="6" cy="6" r="0.8" fill={color}/></svg>;
    case "reply":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M6 4L2 7.5 6 11M2.5 7.5H10a3.5 3.5 0 013.5 3.5V13"/></svg>;
    case "more":      return <svg width={s} height={s} viewBox="0 0 16 16"><circle cx="4" cy="8" r="1" fill={color}/><circle cx="8" cy="8" r="1" fill={color}/><circle cx="12" cy="8" r="1" fill={color}/></svg>;
    case "check":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 8.5L6.5 12 13 5"/></svg>;
    case "x":         return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M4 4l8 8M12 4l-8 8"/></svg>;
    case "pencil":    return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M11 2.5l2.5 2.5-7.5 7.5H3.5V10L11 2.5z"/><path {...stroke} d="M9.5 4l2.5 2.5"/></svg>;
    case "refresh":   return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M13 8a5 5 0 11-1.5-3.5"/><path {...stroke} d="M13 2v3.5H9.5"/></svg>;
    case "trash":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 5h10M6 5V3.5h4V5M6.5 8v4M9.5 8v4M4 5l.8 7.5h6.4L12 5"/></svg>;
    case "users":     return <svg width={s} height={s} viewBox="0 0 16 16"><circle {...stroke} cx="6" cy="5.5" r="2.5"/><path {...stroke} d="M1.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/><path {...stroke} d="M11 4a2.5 2.5 0 010 5M14.5 13c0-2-1.2-3.5-3.5-3.5"/></svg>;
    case "person":      return <svg width={s} height={s} viewBox="0 0 16 16"><circle {...stroke} cx="8" cy="5.5" r="2.5"/><path {...stroke} d="M3 13.5c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>;
    case "filter":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M2 4h12M4.5 8h7M7 12h2"/></svg>;
    case "arrow-right": return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 8h10M9 4.5L12.5 8 9 11.5"/></svg>;
    default:            return null;
  }
}
