export function char(c) {
  return (str) => {
    return str[0] === c;
  };
}

export function digit(str) {
  switch (str[0]) {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return true;
    default:
      return false;
  }
}

export function oneOf(...parsers) {
  return (str) => {
    for (const parser of parsers) {
      if (parser(str)) {
        return true;
      }
    }

    return false;
  };
}
