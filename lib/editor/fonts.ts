export const editorFonts = [
  "Abril Fatface",
  "Aleo",
  "Amatic SC",
  "Archivo",
  "Bangers",
  "Barlow Condensed",
  "Bungee Inline",
  "Carter One",
  "Caveat",
  "Coiny",
  "Courier Prime",
  "Elsie Swash Caps",
  "Fira Sans",
  "Krona One",
  "Kumar One Outline",
  "Lobster Two",
  "Manrope",
  "Monoton",
  "Montserrat",
  "Nixie One",
  "Notable",
  "Nunito",
  "Open Sans",
  "Ostrich Sans",
  "Oswald",
  "Palanquin Dark",
  "Parisienne",
  "Permanent Marker",
  "Petit Formal Script",
  "Playfair Display",
  "Poppins",
  "Quicksand",
  "Rasa",
  "Roboto",
  "Roboto Condensed",
  "Roboto Slab",
  "Sancreek",
  "Shrikhand",
  "Source Code Pro",
  "Source Sans Pro",
  "Source Serif Pro",
  "Space Grotesk",
  "Space Mono",
  "Stint Ultra Condensed",
  "Stint Ultra Expanded",
  "Sue Ellen Francisco",
  "TrashHand",
  "Ultra",
  "VT323",
  "Yeseva One"
];

export const editorFontVariantLabels = ["Regular", "Bold", "Italic", "Bold Italic"] as const;

export type EditorFontVariant = {
  label: (typeof editorFontVariantLabels)[number];
  fontWeight: "400" | "700";
  fontStyle: "normal" | "italic";
};

export const editorFontVariants: EditorFontVariant[] = [
  { label: "Regular", fontWeight: "400", fontStyle: "normal" },
  { label: "Bold", fontWeight: "700", fontStyle: "normal" },
  { label: "Italic", fontWeight: "400", fontStyle: "italic" },
  { label: "Bold Italic", fontWeight: "700", fontStyle: "italic" }
];

export const expandableEditorFonts = [
  "Amatic SC",
  "Archivo",
  "Barlow Condensed",
  "Caveat",
  "Courier Prime",
  "Elsie Swash Caps",
  "Fira Sans",
  "Lobster Two",
  "Manrope",
  "Montserrat",
  "Nunito",
  "Open Sans",
  "Oswald",
  "Palanquin Dark",
  "Playfair Display",
  "Poppins",
  "Quicksand",
  "Rasa",
  "Roboto",
  "Roboto Condensed",
  "Roboto Slab",
  "Source Code Pro",
  "Source Sans Pro",
  "Source Serif Pro",
  "Space Grotesk",
  "Space Mono"
];

export const editorFontPresets = editorFonts.map((font) => ({
  name: font,
  font,
  size: font === "Amatic SC" || font === "Caveat" || font === "Lobster Two" || font === "Parisienne" || font === "Permanent Marker" || font === "Petit Formal Script" || font === "Sancreek" || font === "Shrikhand" || font === "Sue Ellen Francisco" || font === "TrashHand"
    ? 82
    : font === "Bungee Inline" || font === "Monoton" || font === "Kumar One Outline" || font === "Source Code Pro" || font === "Space Mono" || font === "Stint Ultra Condensed" || font === "Stint Ultra Expanded" || font === "VT323"
      ? 48
      : 64,
  color: "#151515"
}));
