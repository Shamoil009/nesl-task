export enum DrawAction {
  Select = "select",
  Rectangle = "rectangle",
}

export const PAINT_OPTIONS = [
  {
    id: DrawAction.Select,
    label: "Select Shapes",
  },
  { id: DrawAction.Rectangle, label: "Draw Rectangle" },
];
