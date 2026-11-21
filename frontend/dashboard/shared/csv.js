const requiredFields = [
  "timestamp",
  "room",
  "capacity",
  "occupancy",
  "co2",
  "temperature",
  "humidity",
  "illuminance",
];
function csvRows(input) {
  const text = input.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    value = "",
    quoted = false,
    closed = false;
  function endField() {
    row.push(value.trim());
    value = "";
    closed = false;
  }
  function endRow() {
    endField();
    if (row.some((cell) => cell !== "")) rows.push(row);
    row = [];
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch !== '"') value += ch;
      else if (text[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = false;
        closed = true;
      }
    } else if (ch === ",") endField();
    else if (ch === "\n" || ch === "\r") {
      endRow();
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else if (ch === '"' && !value && !closed) quoted = true;
    else if (ch === '"' || (closed && !/\s/.test(ch)))
      throw Error("Unexpected character in a quoted CSV field.");
    else value += ch;
  }
  if (quoted) throw Error("A quoted CSV field is missing its closing quote.");
  endRow();
  return rows;
}

export function csvRecords(text) {
  const [header, ...rows] = csvRows(text);
  if (!header) throw new Error("The file has no CSV header.");
  if (new Set(header).size !== header.length) throw new Error("Column names must be unique.");
  const missing = requiredFields.filter((field) => !header.includes(field));
  if (missing.length) throw new Error("Missing columns: " + missing.join(", ") + ".");
  return rows.map((cells, index) => {
    if (cells.length !== header.length)
      throw new Error("Incorrect field count in reading " + (index + 1) + ".");
    return Object.fromEntries(header.map((field, i) => [field, cells[i]]));
  });
}
