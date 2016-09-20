/** 
 * @module stream
 * This module provides the Stream class, which iterates through lines of a string.
 */

/**
 * @class
 * @param {string} sequence - A sequence of characters. The string to build this stream around.
 */
function Stream(sequence) {
  this.sequences = sequence.split(/\r?\n/);
  this.totalLines = this.sequences.length;
  this.lineNumber = 0;
}

/** 
 * Get the next line in the stream, without advancing the cursor.
 * @returns {string} The next line.
 */
Stream.prototype.peekNextLine = function () {
  return this.hasNext() ? this.sequences[this.lineNumber] : null;
};

/**
 * Get the next line in the stream, and advance the cursor to the next line.
 * @returns {string} The next line.
 */
Stream.prototype.getNextLine = function () {
  return this.hasNext() ? this.sequences[this.lineNumber++] : null;
};

/**
 * Check if the stream has additional lines.
 * @returns {boolean} Whether there is a next line in the stream.
 */
Stream.prototype.hasNext = function () {
  return this.lineNumber < this.totalLines;
};


if (typeof exports !== "undefined") {
  exports.Stream = Stream;
}
