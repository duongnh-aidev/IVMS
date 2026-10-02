import { useEffect, useRef } from 'react';

/**
 * Reports an element's width (on mount and on resize) to `onWidth`.
 * Returns the ref to attach to the element.
 */
export function useElementWidth(onWidth) {
  const ref = useRef(null);
  const callback = useRef(onWidth);
  callback.current = onWidth;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(() => callback.current(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
