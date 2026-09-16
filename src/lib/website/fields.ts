/** Field descriptors that drive the builder's Content settings panel (spec §16). */
export type FieldOption = { value: string; label: string };

export type Field =
  | { key: string; label: string; type: "text"; placeholder?: string; help?: string }
  | { key: string; label: string; type: "textarea"; placeholder?: string; rows?: number; help?: string }
  | { key: string; label: string; type: "richtext"; placeholder?: string; help?: string }
  | { key: string; label: string; type: "number"; min?: number; max?: number; step?: number; help?: string }
  | { key: string; label: string; type: "switch"; help?: string }
  | { key: string; label: string; type: "color"; help?: string }
  | { key: string; label: string; type: "image"; help?: string }
  | { key: string; label: string; type: "url"; placeholder?: string; help?: string }
  | { key: string; label: string; type: "select"; options: FieldOption[]; help?: string }
  | { key: string; label: string; type: "segmented"; options: FieldOption[]; help?: string }
  | { key: string; label: string; type: "slider"; min: number; max: number; step?: number; unit?: string; help?: string }
  | { key: string; label: string; type: "products"; help?: string }
  | { key: string; label: string; type: "category"; help?: string }
  | { key: string; label: string; type: "icon"; help?: string }
  | { key: string; label: string; type: "page"; help?: string }
  | {
      key: string;
      label: string;
      type: "repeater";
      itemLabel: string;
      addLabel?: string;
      max?: number;
      fields: Field[];
      defaultItem: Record<string, unknown>;
      titleKey?: string;
      help?: string;
    };

export const ALIGN_OPTIONS: FieldOption[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export const COLUMN_OPTIONS: FieldOption[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
];
