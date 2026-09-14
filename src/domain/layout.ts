// The node diamond spans 68 map units between its left and right ports.
export const NODE_WIDTH = 68;
export const SNAP_STEP = NODE_WIDTH / 2;
export const snapCoordinate = (value: number) =>
  Math.round(value / SNAP_STEP) * SNAP_STEP;
