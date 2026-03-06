export function today() {
  return new Date().toISOString().split("T")[0];
}

export function dateDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}