"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCurrentUnix = getCurrentUnix;

function getCurrentUnix() {
  return new Date().getTime() || 0;
}