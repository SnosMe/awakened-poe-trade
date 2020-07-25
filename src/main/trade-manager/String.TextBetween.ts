interface String {
  textBetween: (start: string, end: string) => string;
}

String.prototype.textBetween = function(
  start: string,
  end: string = ""
): string {
  let startIndex = this.indexOf(start);

  if (startIndex < 0) {
    return "";
  }

  startIndex += start.length;

  if (end) {
    const endIndex = this.indexOf(end);

    if (endIndex < 0) {
      return "";
    }

    return this.substring(startIndex, endIndex);
  } else {
    return this.substring(startIndex);
  }
};
