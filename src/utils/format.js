export function formatDate(timestamp, { includeYear = false } = {}) {
  const options = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  if (includeYear) {
    options.year = "numeric";
  }

  return new Date(timestamp).toLocaleDateString(undefined, options);
}

export function formatRam(mb) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export function formatTabCount(count) {
  return `${count} ${pluralize(count, "tab")}`;
}
