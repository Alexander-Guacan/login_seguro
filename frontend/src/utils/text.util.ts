export function capitalize(text: string) {
  if (!text) return "";
  const [firstLetter, ...rest] = Array.from(text);
  return firstLetter.toLocaleUpperCase() + rest.join("").toLocaleLowerCase();
}
