// Adapters that turn DOM events into plain values, so controller intents stay DOM-free.

/** `onChange` handler that passes the input's value. */
export const withValue = (fn) => (e) => fn(e.target.value);

/** Handler that calls `preventDefault()` first (form submit, drag start). */
export const prevented = (fn) => (e) => {
  e.preventDefault();
  fn();
};

/** Handler that stops propagation first (buttons inside clickable rows). */
export const stopped = (fn) => (e) => {
  e && e.stopPropagation();
  fn();
};
