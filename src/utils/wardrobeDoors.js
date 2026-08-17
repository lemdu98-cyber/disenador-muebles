export const HINGED_DOOR_OPEN_ANGLE_RAD = Math.PI / 2;
export const HINGED_DOOR_HANDLE_INSET_RATIO = .18;

export function calculateLeftHingedDoorTransform({ centerX, width, open }) {
  return {
    hingeX: centerX - width / 2,
    panelCenterX: width / 2,
    handleCenterX: width * (1 - HINGED_DOOR_HANDLE_INSET_RATIO),
    rotationY: open ? -HINGED_DOOR_OPEN_ANGLE_RAD : 0,
  };
}
