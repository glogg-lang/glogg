/* Based on: Unlocking the Power of Parser Combinators by Rory Mulligan

https://www.sitepen.com/blog/unlocking-the-power-of-parser-combinators-a-beginners-guide
*/

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

export function sequence(...parsers) {
  return (str) => {
    let rest = str;
    let value = "";
    let forKeeps = [];

    for (const parser of parsers) {
      const result = parser(rest);

      if (result.success) {
        rest = result.rest;
        value += result.value;

        if (result.forKeeps) {
          forKeeps.push(result.value);
        }
      } else {
        return { success: false };
      }
    }

    const result = {
      success: true,
      value: value,
      rest: rest,
    };

    if (forKeeps.length > 0) {
      result.forKeeps = forKeeps;
    }

    return result;
  };
}

export function nOrMore(n, parser) {
  return (str) => {
    let iterations = 0;
    let value = "";
    let rest = str;

    while (true) {
      const result = parser(rest);

      if (result.success) {
        value += result.value;
        rest = result.rest;
        iterations++;
      } else {
        break;
      }
    }

    if (iterations >= n) {
      return {
        success: true,
        value: value,
        rest: rest,
      };
    }

    return { success: false };
  };
}

export function keep(parser) {
  return (str) => {
    const result = parser(str);

    if (result.success) {
      result.forKeeps = result.value;
    }

    return result;
  };
}
