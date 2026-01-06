
export interface Filament {
  id: string;
  brand: string;
  model: string; // e.g., PLA, PETG, ABS
  color: string; // Hex code
  colorName: string;
  nozzleTemp: number;
  bedTemp: number;
  flowRate: number;
  pressureAdvance: number;
  weightNew: number; // Grams
  weightCurrent: number; // Grams
  lastModified: number;
}

export type FilamentFilter = {
  search: string;
  color: string | null;
  material: string | null;
};
