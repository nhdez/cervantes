import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["a", "b", "i", "em", "strong", "code", "pre", "p"];
const ALLOWED_ATTR = ["href"];

export function sanitizeHtml(dirty: string | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS, ALLOWED_ATTR, FORCE_BODY: false });
}
