// src/lib/utils.js
export function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export function nextOccurrenceOfNov30At19() {
  const now = new Date();
  const year =
    now.getMonth() > 10 || (now.getMonth() === 10 && now.getDate() > 30)
      ? now.getFullYear() + 1
      : now.getFullYear();
  return new Date(year, 10, 30, 19, 0, 0);
}
