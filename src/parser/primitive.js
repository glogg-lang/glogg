export function char(c) {
  return (str) => {
    const char = str[0];
    if (char === c) {
      return {
        success: true,
        value: char,
        rest: str.slice(1),
      };
    } else {
      return { success: false };
    }
  };
}

export function digit(str) {
  const char = str[0];
  switch (char) {
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
      return {
        success: true,
        value: char,
        rest: str.slice(1),
      };
    default:
      return { success: false };
  }
}

export function oneOf(...parsers) {
  return (str) => {
    for (const parser of parsers) {
      const result = parser(str);
      if (result.success) {
        return result;
      }
    }

    return { success: false };
  };
}
