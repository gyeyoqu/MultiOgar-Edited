'use strict';
/*
 * Simple BinaryWriter is a minimal tool to write binary stream with unpredictable size.
 * Useful for binary serialization.
 *
 * Copyright (c) 2016 Barbosik https://github.com/Barbosik
 * License: Apache License, Version 2.0
 */

function BinaryWriter() {
    this._buffer = parseInt(process.version[1]) < 6 ? new Buffer(1e5) : Buffer.allocUnsafe(1e5);
    this._length = 0;
}

module.exports = BinaryWriter;

BinaryWriter.prototype.writeUInt8 = function (value) {
    this._buffer.writeUInt8(value, this._length++, true);
};

BinaryWriter.prototype.writeUInt16 = function (value) {
    this._buffer.writeUInt16LE(value, this._length, true);
    this._length += 2;
};

BinaryWriter.prototype.writeUInt32 = function (value) {
    this._buffer.writeUInt32LE(value, this._length, true);
    this._length += 4;
};

BinaryWriter.prototype.writeFloat = function (value) {
    this._buffer.writeFloatLE(value, this._length, true);
    this._length += 4;
};

BinaryWriter.prototype.writeDouble = function (value) {
    this._buffer.writeDoubleLE(value, this._length, true);
    this._length += 8;
};

BinaryWriter.prototype.writeBytes = function (data) {
    data.copy(this._buffer, this._length, 0, data.length);
    this._length += data.length;
};

BinaryWriter.prototype.writeStringZeroUtf8 = function (value) {
    var length = Buffer.byteLength(value, 'utf8');
    this._buffer.write(value, this._length, 'utf8');
    this._length += length;
    this.writeUInt8(0);
};

BinaryWriter.prototype.writeStringZeroUnicode = function (value) {
    var length = Buffer.byteLength(value, 'ucs2');
    this._buffer.write(value, this._length, 'ucs2');
    this._length += length;
    this.writeUInt16(0);
};

BinaryWriter.prototype.toBuffer = function () {
    return Buffer.concat([this._buffer.slice(0, this._length)]);
};
