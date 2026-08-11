// Comprehensive shapes library matching Canva's shape collection
export type ShapeDefinition = {
  label: string;
  category: string;
  path: string; // SVG path data
  viewBox?: string;
};

export const shapeCategories = [
  "All",
  "Basic",
  "Polygons",
  "Stars",
  "Arrows",
  "Flowchart",
  "Badges",
  "Speech Bubbles"
] as const;

export const shapes: ShapeDefinition[] = [
  // Row 1 - Stars & Special
  { label: "4-Point Star", category: "Stars", path: "M50 10 L35 45 L0 50 L35 55 L50 90 L65 55 L100 50 L65 45 Z", viewBox: "0 0 100 100" },
  { label: "Triangle Right", category: "Arrows", path: "M10 10 L90 50 L10 90 Z", viewBox: "0 0 100 100" },
  { label: "Half Circle", category: "Basic", path: "M10 90 A40 40 0 0 1 90 90 Z", viewBox: "0 0 100 100" },
  { label: "Leaf", category: "Basic", path: "M50 10 Q80 50 50 90 Q20 50 50 10 Z", viewBox: "0 0 100 100" },
  { label: "Water Drop", category: "Basic", path: "M50 10 Q70 40 70 60 Q70 80 50 90 Q30 80 30 60 Q30 40 50 10 Z", viewBox: "0 0 100 100" },
  { label: "Cloud", category: "Basic", path: "M30 50 Q20 40 30 30 Q40 20 50 30 Q60 20 70 30 Q80 40 70 50 Z", viewBox: "0 0 100 100" },
  { label: "Sun Badge", category: "Badges", path: "M50 20 L55 35 L70 35 L58 45 L63 60 L50 50 L37 60 L42 45 L30 35 L45 35 Z M50 50 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0", viewBox: "0 0 100 100" },
  { label: "5-Point Star Filled", category: "Stars", path: "M50 10 L61 38 L91 38 L67 56 L78 84 L50 66 L22 84 L33 56 L9 38 L39 38 Z", viewBox: "0 0 100 100" },
  { label: "6-Point Star Filled", category: "Stars", path: "M50 10 L60 30 L82 30 L67 45 L77 65 L50 50 L23 65 L33 45 L18 30 L40 30 Z", viewBox: "0 0 100 100" },
  { label: "8-Point Star", category: "Stars", path: "M50 10 L54 40 L70 20 L60 45 L90 35 L65 50 L90 65 L60 55 L70 80 L54 60 L50 90 L46 60 L30 80 L40 55 L10 65 L35 50 L10 35 L40 45 L30 20 L46 40 Z", viewBox: "0 0 100 100" },
  { label: "4-Point Star 2", category: "Stars", path: "M50 15 L40 45 L10 50 L40 55 L50 85 L60 55 L90 50 L60 45 Z", viewBox: "0 0 100 100" },

  // Row 2 - Circles & Squares
  { label: "Starburst", category: "Stars", path: "M50 5 L52 42 L70 15 L58 46 L90 25 L63 50 L90 75 L58 54 L70 85 L52 58 L50 95 L48 58 L30 85 L42 54 L10 75 L37 50 L10 25 L42 46 L30 15 L48 42 Z", viewBox: "0 0 100 100" },
  { label: "Crescent", category: "Basic", path: "M50 10 Q30 30 30 50 Q30 70 50 90 Q60 70 60 50 Q60 30 50 10 Z M50 20 Q55 35 55 50 Q55 65 50 80 Q45 65 45 50 Q45 35 50 20 Z", viewBox: "0 0 100 100" },
  { label: "Arch", category: "Basic", path: "M10 90 Q10 30 50 30 Q90 30 90 90 Z", viewBox: "0 0 100 100" },
  { label: "Square", category: "Basic", path: "M20 20 L80 20 L80 80 L20 80 Z", viewBox: "0 0 100 100" },
  { label: "Rounded Square", category: "Basic", path: "M20 30 Q20 20 30 20 L70 20 Q80 20 80 30 L80 70 Q80 80 70 80 L30 80 Q20 80 20 70 Z", viewBox: "0 0 100 100" },
  { label: "Square Soft", category: "Basic", path: "M25 25 L75 25 L75 75 L25 75 Z", viewBox: "0 0 100 100" },
  { label: "Circle", category: "Basic", path: "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0", viewBox: "0 0 100 100" },
  { label: "Circle Thick", category: "Basic", path: "M50 50 m-35 0 a35 35 0 1 0 70 0 a35 35 0 1 0 -70 0", viewBox: "0 0 100 100" },
  { label: "Ring", category: "Basic", path: "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0 M50 50 m-25 0 a25 25 0 1 1 50 0 a25 25 0 1 1 -50 0", viewBox: "0 0 100 100" },
  { label: "Ring Thick", category: "Basic", path: "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0 M50 50 m-20 0 a20 20 0 1 1 40 0 a20 20 0 1 1 -40 0", viewBox: "0 0 100 100" },
  { label: "Ring Thin", category: "Basic", path: "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0 M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0", viewBox: "0 0 100 100" },

  // Row 3 - Stars & Polygons
  { label: "5-Point Star Outline", category: "Stars", path: "M50 10 L61 38 L91 38 L67 56 L78 84 L50 66 L22 84 L33 56 L9 38 L39 38 Z", viewBox: "0 0 100 100" },
  { label: "6-Point Star Outline", category: "Stars", path: "M50 10 L60 30 L82 30 L67 45 L77 65 L50 50 L23 65 L33 45 L18 30 L40 30 Z", viewBox: "0 0 100 100" },
  { label: "Crescent Moon", category: "Basic", path: "M50 10 Q20 30 20 50 Q20 70 50 90 Q65 75 65 50 Q65 25 50 10 Z", viewBox: "0 0 100 100" },
  { label: "Crescent Thick", category: "Basic", path: "M45 10 Q15 30 15 50 Q15 70 45 90 Q55 75 55 50 Q55 25 45 10 Z", viewBox: "0 0 100 100" },
  { label: "Filled Circle", category: "Basic", path: "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0", viewBox: "0 0 100 100" },
  { label: "Pentagon", category: "Polygons", path: "M50 10 L90 40 L75 85 L25 85 L10 40 Z", viewBox: "0 0 100 100" },
  { label: "Hexagon", category: "Polygons", path: "M30 15 L70 15 L90 50 L70 85 L30 85 L10 50 Z", viewBox: "0 0 100 100" },
  { label: "Octagon", category: "Polygons", path: "M30 10 L70 10 L90 30 L90 70 L70 90 L30 90 L10 70 L10 30 Z", viewBox: "0 0 100 100" },
  { label: "4-Point Star 3", category: "Stars", path: "M50 10 L45 40 L15 45 L40 50 L35 80 L50 55 L65 80 L60 50 L85 45 L55 40 Z", viewBox: "0 0 100 100" },
  { label: "4-Point Star 4", category: "Stars", path: "M50 5 L48 45 L8 47 L44 50 L42 90 L50 54 L58 90 L56 50 L92 47 L52 45 Z", viewBox: "0 0 100 100" },
  { label: "Diamond", category: "Polygons", path: "M50 10 L90 50 L50 90 L10 50 Z", viewBox: "0 0 100 100" },

  // Row 4 - Water Drops & Pills
  { label: "Drop 1", category: "Basic", path: "M50 10 Q70 35 70 55 Q70 75 50 90 Q30 75 30 55 Q30 35 50 10 Z", viewBox: "0 0 100 100" },
  { label: "Drop 2", category: "Basic", path: "M50 15 Q68 38 68 58 Q68 73 50 85 Q32 73 32 58 Q32 38 50 15 Z", viewBox: "0 0 100 100" },
  { label: "Drop 3", category: "Basic", path: "M50 20 Q65 40 65 60 Q65 75 50 85 Q35 75 35 60 Q35 40 50 20 Z", viewBox: "0 0 100 100" },
  { label: "Heart", category: "Basic", path: "M50 80 Q20 60 20 40 Q20 20 35 20 Q45 20 50 30 Q55 20 65 20 Q80 20 80 40 Q80 60 50 80 Z", viewBox: "0 0 100 100" },
  { label: "Arrow Right", category: "Arrows", path: "M10 35 L60 35 L60 20 L90 50 L60 80 L60 65 L10 65 Z", viewBox: "0 0 100 100" },
  { label: "Pill", category: "Basic", path: "M30 20 L70 20 Q90 20 90 50 Q90 80 70 80 L30 80 Q10 80 10 50 Q10 20 30 20 Z", viewBox: "0 0 100 100" },
  { label: "Rounded Rectangle", category: "Basic", path: "M20 30 Q20 20 30 20 L70 20 Q80 20 80 30 L80 70 Q80 80 70 80 L30 80 Q20 80 20 70 Z", viewBox: "0 0 100 100" },
  { label: "Pill Horizontal", category: "Basic", path: "M25 30 L75 30 Q85 30 85 50 Q85 70 75 70 L25 70 Q15 70 15 50 Q15 30 25 30 Z", viewBox: "0 0 100 100" },
  { label: "Parallelogram", category: "Polygons", path: "M30 20 L80 20 L70 80 L20 80 Z", viewBox: "0 0 100 100" },
  { label: "Pill Vertical", category: "Basic", path: "M30 25 L70 25 Q80 25 80 30 L80 70 Q80 75 70 75 L30 75 Q20 75 20 70 L20 30 Q20 25 30 25 Z", viewBox: "0 0 100 100" },
  { label: "Diamond 2", category: "Polygons", path: "M50 15 L85 50 L50 85 L15 50 Z", viewBox: "0 0 100 100" },

  // Row 5 - Squares & Triangles
  { label: "Square Filled", category: "Basic", path: "M20 20 L80 20 L80 80 L20 80 Z", viewBox: "0 0 100 100" },
  { label: "Square Rounded", category: "Basic", path: "M20 30 Q20 20 30 20 L70 20 Q80 20 80 30 L80 70 Q80 80 70 80 L30 80 Q20 80 20 70 Z", viewBox: "0 0 100 100" },
  { label: "Parallelogram 2", category: "Polygons", path: "M25 25 L75 25 L65 75 L15 75 Z", viewBox: "0 0 100 100" },
  { label: "Parallelogram 3", category: "Polygons", path: "M35 20 L85 20 L75 80 L25 80 Z", viewBox: "0 0 100 100" },
  { label: "Triangle Up", category: "Polygons", path: "M50 20 L80 80 L20 80 Z", viewBox: "0 0 100 100" },
  { label: "Triangle Up 2", category: "Polygons", path: "M50 15 L85 85 L15 85 Z", viewBox: "0 0 100 100" },
  { label: "Triangle Rounded", category: "Polygons", path: "M50 20 Q55 25 60 35 L75 75 Q75 80 70 80 L30 80 Q25 80 25 75 L40 35 Q45 25 50 20 Z", viewBox: "0 0 100 100" },
  { label: "Triangle Up 3", category: "Polygons", path: "M50 25 L75 75 L25 75 Z", viewBox: "0 0 100 100" },
  { label: "Ellipse", category: "Basic", path: "M20 50 Q20 30 50 30 Q80 30 80 50 Q80 70 50 70 Q20 70 20 50 Z", viewBox: "0 0 100 100" },
  { label: "Ellipse Horizontal", category: "Basic", path: "M15 50 Q15 35 50 35 Q85 35 85 50 Q85 65 50 65 Q15 65 15 50 Z", viewBox: "0 0 100 100" },
  { label: "Egg", category: "Basic", path: "M50 20 Q70 30 70 55 Q70 75 50 85 Q30 75 30 55 Q30 30 50 20 Z", viewBox: "0 0 100 100" },

  // Row 6 - Special Shapes & Polygons
  { label: "Cross", category: "Polygons", path: "M40 10 L60 10 L60 40 L90 40 L90 60 L60 60 L60 90 L40 90 L40 60 L10 60 L10 40 L40 40 Z", viewBox: "0 0 100 100" },
  { label: "Cross 2", category: "Polygons", path: "M35 15 L65 15 L65 35 L85 35 L85 65 L65 65 L65 85 L35 85 L35 65 L15 65 L15 35 L35 35 Z", viewBox: "0 0 100 100" },
  { label: "Circle Dot", category: "Basic", path: "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0 M50 50 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0", viewBox: "0 0 100 100" },
  { label: "Clover", category: "Basic", path: "M50 30 Q40 30 40 20 Q40 10 50 10 Q60 10 60 20 Q60 30 50 30 M30 50 Q30 40 20 40 Q10 40 10 50 Q10 60 20 60 Q30 60 30 50 M70 50 Q70 40 80 40 Q90 40 90 50 Q90 60 80 60 Q70 60 70 50 M50 70 Q40 70 40 80 Q40 90 50 90 Q60 90 60 80 Q60 70 50 70", viewBox: "0 0 100 100" },
  { label: "Shield", category: "Badges", path: "M50 10 L85 25 L85 50 Q85 75 50 90 Q15 75 15 50 L15 25 Z", viewBox: "0 0 100 100" },
  { label: "Shield 2", category: "Badges", path: "M50 15 L80 28 L80 50 Q80 70 50 85 Q20 70 20 50 L20 28 Z", viewBox: "0 0 100 100" },
  { label: "Shield 3", category: "Badges", path: "M50 20 L75 30 L75 52 Q75 67 50 80 Q25 67 25 52 L25 30 Z", viewBox: "0 0 100 100" },
  { label: "Shield 4", category: "Badges", path: "M50 25 L70 33 L70 53 Q70 65 50 75 Q30 65 30 53 L30 33 Z", viewBox: "0 0 100 100" },
  { label: "Half Circle Right", category: "Basic", path: "M10 10 L50 10 Q90 10 90 50 Q90 90 50 90 L10 90 Z", viewBox: "0 0 100 100" },
  { label: "Pill Long", category: "Basic", path: "M15 30 L85 30 Q95 30 95 50 Q95 70 85 70 L15 70 Q5 70 5 50 Q5 30 15 30 Z", viewBox: "0 0 100 100" },
  { label: "Location Pin", category: "Basic", path: "M50 10 Q65 10 73 23 Q80 35 80 48 Q80 60 50 90 Q20 60 20 48 Q20 35 27 23 Q35 10 50 10 Z M50 35 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0", viewBox: "0 0 100 100" },

  // Flowchart shapes
  { label: "Flowchart Process", category: "Flowchart", path: "M15 25 L85 25 Q90 25 90 30 L90 70 Q90 75 85 75 L15 75 Q10 75 10 70 L10 30 Q10 25 15 25 Z", viewBox: "0 0 100 100" },
  { label: "Flowchart Decision", category: "Flowchart", path: "M50 10 L90 50 L50 90 L10 50 Z", viewBox: "0 0 100 100" },
  { label: "Flowchart Terminator", category: "Flowchart", path: "M30 20 L70 20 Q90 20 90 50 Q90 80 70 80 L30 80 Q10 80 10 50 Q10 20 30 20 Z", viewBox: "0 0 100 100" },
  { label: "Flowchart Document", category: "Flowchart", path: "M20 20 L80 20 L80 55 Q50 70 20 55 Z", viewBox: "0 0 100 100" },
  { label: "Flowchart Data", category: "Flowchart", path: "M25 20 L85 20 L75 80 L15 80 Z", viewBox: "0 0 100 100" },
  { label: "Flowchart Preparation", category: "Flowchart", path: "M35 15 L65 15 L85 50 L65 85 L35 85 L15 50 Z", viewBox: "0 0 100 100" },

  // Speech Bubbles
  { label: "Speech Bubble Round", category: "Speech Bubbles", path: "M25 45 Q20 25 40 20 Q50 10 65 15 Q85 20 80 45 Q85 70 65 70 L50 70 L40 85 L35 70 L30 70 Q15 65 20 45 Z", viewBox: "0 0 100 100" },
  { label: "Speech Bubble Oval", category: "Speech Bubbles", path: "M20 50 Q20 25 50 25 Q80 25 80 50 Q80 75 50 75 Q20 75 20 50 Z M78 60 L92 78 L80 66 Z", viewBox: "0 0 100 100" },
  { label: "Speech Bubble Rect", category: "Speech Bubbles", path: "M20 20 L80 20 L80 60 L45 60 L35 78 L35 60 L20 60 Z", viewBox: "0 0 100 100" },
  { label: "Speech Bubble Cloud", category: "Speech Bubbles", path: "M30 40 Q25 28 35 24 Q40 14 55 20 Q72 14 78 32 Q88 38 82 54 Q86 70 68 70 L55 70 L45 84 L42 70 L32 70 Q18 64 24 50 Z", viewBox: "0 0 100 100" },
  { label: "Speech Bubble Thought", category: "Speech Bubbles", path: "M50 20 Q70 20 80 35 Q90 50 80 65 Q70 80 50 80 Q35 80 25 70 L15 85 L20 65 Q10 55 15 40 Q20 20 50 20 Z", viewBox: "0 0 100 100" }
];
