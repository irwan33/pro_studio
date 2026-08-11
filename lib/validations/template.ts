import { z } from "zod";
import { sceneSchema } from "@/lib/validations/project";

export const templateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).default(""),
  category: z.string().min(1),
  sportType: z.string().min(1).default("Football"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  thumbnailUrl: z.string().default(""),
  sceneJson: sceneSchema,
  isPremium: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});
