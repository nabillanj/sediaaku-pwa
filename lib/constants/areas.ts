export const BANDUNG_AREAS = [
  "Kota Bandung",
  "Kabupaten Bandung",
  "Kabupaten Bandung Barat",
  "Kota Cimahi",
] as const;

export type BandungArea = (typeof BANDUNG_AREAS)[number];
