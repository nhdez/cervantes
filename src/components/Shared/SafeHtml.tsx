import { sanitizeHtml } from "../../lib/sanitize";

interface SafeHtmlProps {
  html: string | undefined;
  style?: React.CSSProperties;
  className?: string;
}

export function SafeHtml({ html, style, className }: SafeHtmlProps) {
  // sanitizeHtml runs DOMPurify before this reaches the DOM
  return (
    <div
      style={style}
      className={className}
      // Content is sanitized by DOMPurify in sanitizeHtml() — safe for HN HTML
      {...{ dangerouslySetInnerHTML: { __html: sanitizeHtml(html) } }}
    />
  );
}
