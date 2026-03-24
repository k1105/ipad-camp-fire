export interface ModeEntry {
  key: number;
  label: string;
}

export const MODE_LIST: ModeEntry[] = [
  {key: 1, label: "カメラ+サーモ"},
  {key: 2, label: "カメラ+フラッシュ"},
  {key: 3, label: "VJ映像+サーモ"},
  {key: 4, label: "VJ映像+フラッシュ"},
  {key: 5, label: "白単色"},
  {key: 6, label: "赤単色"},
  {key: 7, label: "黒単色"},
  {key: 8, label: "Sin波トランジション"},
];

export const SIGNAL_CHANNEL = "ipad-camp-fire-signal";
