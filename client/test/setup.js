/* eslint-disable no-undef */
// Polyfill for structuredClone in jsdom environment
if (typeof window.structuredClone === "undefined") {
  window.structuredClone = function (obj) {
    if (obj === undefined || obj === null) {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  };
}
