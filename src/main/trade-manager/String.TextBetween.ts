interface String {
  textBetween: (start: string, end: string, startLastOccurence?: boolean, endLastOccurence?: boolean) => string;
}

String.prototype.textBetween = function(
  start: string,
  end: string = "",
  , startLastOccurence: boolean = false, 
  endLastOccurence: boolean = false
): string {
  let startIndex = startLastOccurence ? this.lastIndexOf(start) : this.indexOf(start);

  if (startIndex < 0) {
    return "";
  }

  startIndex += start.length;

  if (end) {
    const endIndex = endLastOccurence ? this.lastIndexOf(end) : this.indexOf(end);

    if (endIndex < 0) {
      return "";
    }

    return this.substring(startIndex, endIndex);
  } else {
    return this.substring(startIndex);
  }
};
