import { z } from "zod";

/**
 * Scene payload validation.
 *
 * `editorSceneSchema` is the current Konva editor document. `legacySceneSchema`
 * still accepts the pre-migration Fabric.js shape so old clients and stored
 * projects keep validating; both are accepted on write and normalised on read
 * through `deserializeEditorState`.
 */

const elementSchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z
    .object({
      id: z.string(),
      type: z.enum(["text", "image", "rect", "circle", "line", "path", "group"]),
      name: z.string().default("Layer"),
      x: z.number(),
      y: z.number(),
      width: z.number().optional(),
      height: z.number().optional(),
      rotation: z.number().default(0),
      scaleX: z.number().default(1),
      scaleY: z.number().default(1),
      opacity: z.number().min(0).max(1).default(1),
      visible: z.boolean().default(true),
      locked: z.boolean().default(false),
      zIndex: z.number().int(),
      properties: z.record(z.unknown()).default({}),
      children: z.array(elementSchema).optional()
    })
    .passthrough()
);

export const editorSceneSchema = z.object({
  version: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  background: z.string().default("#090a09"),
  elements: z.array(elementSchema).default([]),
  metadata: z.record(z.unknown()).default({})
});

/** @deprecated legacy Fabric.js document, accepted for backwards compatibility. */
export const legacySceneSchema = z.object({
  version: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  background: z.string().default("#090a09"),
  objects: z.array(z.record(z.unknown())).default([]),
  metadata: z.record(z.unknown()).default({})
});

export const sceneSchema = z.union([editorSceneSchema, legacySceneSchema]);

export const createProjectSchema = z.object({
  title: z.string().min(1).max(120),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1350),
  templateId: z.string().optional()
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  status: z.enum(["ACTIVE", "TRASHED", "ARCHIVED"]).optional(),
  isFavorite: z.boolean().optional()
});

export const updateSceneSchema = z.object({
  sceneJson: sceneSchema,
  thumbnailUrl: z.string().optional(),
  updatedAt: z.string().datetime().optional()
});
