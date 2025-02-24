export function commit(recs) {
  for (let rec of recs) {
    if (typeof rec.message !== "string") {
      continue;
    }

    if (rec.tag === "log") {
      console.log(rec.message);
    } else if (rec.tag === "error") {
      console.error(rec.message);
    }
  }
}
