export function char(c) {
  return (str) => {
    return str[0] === c;
  };
}
