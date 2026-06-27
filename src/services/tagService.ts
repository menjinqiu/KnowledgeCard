export function normalizeTags(tags: string[] | string) {
  const rawTags = Array.isArray(tags)
    ? tags
    : tags
        .split(/[,，\n]/)
        .map((tag) => tag.trim());

  return Array.from(
    new Set(rawTags.map((tag) => tag.trim()).filter(Boolean)),
  );
}
