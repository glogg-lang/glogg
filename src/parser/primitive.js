/* Based on: Unlocking the Power of Parser Combinators by Rory Mulligan

https://www.sitepen.com/blog/unlocking-the-power-of-parser-combinators-a-beginners-guide
*/

export class Parser {
  constructor(fn) {
    this.run = fn;
  }

  map(fn) {
    const oldParser = this.run;
    return new Parser((str) => {
      const result = oldParser(str);

      if (!result.success) {
        return result;
      }

      try {
        const mapped = fn(result.value);

        return {
          ...result,
          value: mapped,
        };
      } catch (_) {
        return { success: false, expected: "map failed", rest: str };
      }
    });
  }

  keep() {
    const oldParser = this.run;
    return new Parser((str) => {
      const result = oldParser(str);

      if (result.success) {
        result.forKeeps = result.value;
      }

      return result;
    });
  }

  backtrack() {
    const oldParser = this.run;
    return new Parser((str) => {
      const result = oldParser(str);

      if (result.success) {
        result.rest = result.value + result.rest;
      }

      return result;
    });
  }

  mapKeeps(fn) {
    const oldParser = this.run;
    return new Parser((str) => {
      const result = oldParser(str);

      if (!result.success || typeof result.forKeeps === "undefined") {
        return result;
      }

      try {
        const mapped = fn(result.forKeeps);

        return {
          ...result,
          value: mapped,
        };
      } catch (_) {
        return { success: false, expected: "map keeps failed", rest: str };
      }
    });
  }
}

export function char(c) {
  return new Parser((str) => {
    const char = str[0];
    if (char === c) {
      return {
        success: true,
        value: char,
        rest: str.slice(1),
      };
    } else {
      return { success: false, expected: `char: ${c}`, rest: str };
    }
  });
}

export function anythingBut(c) {
  return new Parser((str) => {
    const char = str[0];
    if (char !== c) {
      return {
        success: true,
        value: char,
        rest: str.slice(1),
      };
    } else {
      return { success: false, expected: `anything but ${c}`, rest: str };
    }
  });
}

export function word(word) {
  return new Parser((str) => {
    const substr = str.slice(0, word.length);

    if (substr === word) {
      return {
        success: true,
        value: substr,
        rest: str.slice(word.length),
      };
    }

    return { success: false, expected: `word: ${word}`, rest: str };
  });
}

export const whitespace = new Parser((str) => {
  const char = str[0];
  switch (char) {
    case " ":
    case "\r":
    case "\n":
    case "\t":
      return {
        success: true,
        value: char,
        rest: str.slice(1),
      };
    default:
      return { success: false, expected: "whitespace", rest: str };
  }
});

export const end = new Parser((str) => {
  if (str === "") {
    return {
      success: true,
      value: "",
      rest: "",
    };
  }

  return { success: false, expected: "end", rest: str };
});

export const digit = new Parser((str) => {
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
      return { success: false, expected: "digit", rest: str };
  }
});

const lowercaseRegex = /\p{Ll}/u;

export const lowercase = new Parser((str) => {
  const char = str[0];
  if (!!char && lowercaseRegex.test(char)) {
    return {
      success: true,
      value: char,
      rest: str.slice(1),
    };
  }

  return { success: false, expected: "lowercase", rest: str };
});

const uppercaseRegex = /\p{Lu}/u;

export const uppercase = new Parser((str) => {
  const char = str[0];
  if (uppercaseRegex.test(char)) {
    return {
      success: true,
      value: char,
      rest: str.slice(1),
    };
  }

  return { success: false, expected: "uppercase", rest: str };
});

export function oneOf(...parsers) {
  return new Parser((str) => {
    const failedResults = [];

    for (const parser of parsers) {
      const result = parser.run(str);
      if (result.success) {
        return result;
      }

      failedResults.push(result);
    }

    const furthestParse = failedResults.toSorted(
      (a, b) => a.rest.length - b.rest.length,
    )[0];

    return {
      success: false,
      expected: "(guess from oneOf) " + furthestParse.expected,
      rest: furthestParse.rest,
    };
  });
}

export function sequence(...parsers) {
  return new Parser((str) => {
    let rest = str;
    let value = [];
    let forKeeps = [];

    for (const parser of parsers) {
      const result = parser.run(rest);

      if (result.success) {
        rest = result.rest;
        value.push(result.value);

        if (typeof result.forKeeps !== "undefined") {
          forKeeps.push(result.value);
        }
      } else {
        return result;
      }
    }

    return {
      success: true,
      value: value,
      rest: rest,
      forKeeps: forKeeps.length === 0 ? undefined : forKeeps,
    };
  });
}

export function optional(parser) {
  return new Parser((str) => {
    const result = parser.run(str);

    if (result.success) {
      return result;
    }

    return {
      success: true,
      value: null,
      rest: str,
    };
  });
}

export function nOrMore(n, parser) {
  return new Parser((str) => {
    let iterations = 0;
    let value = [];
    let rest = str;
    let lastFailed = null;

    while (true) {
      const result = parser.run(rest);

      if (result.success) {
        value.push(result.value);
        rest = result.rest;
        iterations++;
      } else {
        lastFailed = result;
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

    return {
      success: false,
      expected: `${n} or more of ${lastFailed != null ? lastFailed.expected : "<>"}`,
      rest: str,
    };
  });
}
