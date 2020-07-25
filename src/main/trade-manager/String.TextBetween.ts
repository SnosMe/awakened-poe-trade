interface String {
  textBetween: (start: string, end: string) => string;
}

String.prototype.textBetween = function(start: string, end: string): string {
  const startIndex = this.indexOf(start);

  if (startIndex < 0) {
    return "";
  }

  const endIndex = this.indexOf(end);

  if (endIndex < 0) {
    return "";
  }

  return this.substring(startIndex, endIndex - startIndex);
};
