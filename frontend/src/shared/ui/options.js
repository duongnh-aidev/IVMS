// View-model builders for the two segmented-control styles used across screens.

/** Light segmented control (white pill on grey track). */
export const lightOption = (label, on, onClick, extra = {}) => ({
  label,
  bg: on ? '#FFFFFF' : 'transparent',
  color: on ? '#171A20' : '#5C5E62',
  shadow: on ? '0 1px 2px rgba(0,0,0,.12)' : 'none',
  onClick,
  ...extra,
});

/** Dark chip (black when selected). `offBg` is the unselected background. */
export const darkOption = (label, on, onClick, offBg = 'transparent', extra = {}) => ({
  label,
  bg: on ? '#171A20' : offBg,
  color: on ? '#FFFFFF' : '#393C41',
  onClick,
  ...extra,
});
