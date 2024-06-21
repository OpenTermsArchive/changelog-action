export function parseInput(value) {
  // Boolean inputs supported by Github Actions
  const trueValues = [ 'true', 'True', 'TRUE' ];
  const falseValues = [ 'false', 'False', 'FALSE' ];

  if (trueValues.includes(value)) {
    return true;
  }
  if (falseValues.includes(value)) {
    return false;
  }

  return value;
}

export function parseRegexString(regexString) {
  const regexPattern = /^\/(.+)\/([a-z]*)$/;
  const match = regexString.match(regexPattern);

  if (match) {
    const pattern = match[1];
    const flags = match[2];

    try {
      return new RegExp(pattern, flags);
    } catch (error) {
      console.error('Invalid regular expression:', error);

      return null;
    }
  } else {
    console.error('Invalid regex string format');

    return null;
  }
}
