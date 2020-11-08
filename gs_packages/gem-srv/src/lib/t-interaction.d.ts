export enum ControlMode {
  static = 0,
  puppet,
  auto
}

export interface IActable {
  isSelected: boolean;
  isHovered: boolean;
  isGrouped: boolean;
  isCaptive: boolean;
  setSelected: (mode: boolean) => boolean;
  setHovered: (mode: boolean) => boolean;
  setGrouped: (mode: boolean) => boolean;
  setCaptive: (mode: boolean) => boolean;
}
