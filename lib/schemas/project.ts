import { ProjectStatus } from "@prisma/client";
import { z } from "zod";

export const projectUrlEntrySchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(200),
  url: z.string().trim().url("Must be a valid URL").max(2048),
});

export const projectUrlEntryListSchema = z
  .array(projectUrlEntrySchema)
  .max(50, "At most 50 entries");

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().max(120).optional(),
  status: z.nativeEnum(ProjectStatus),
});

export const projectMemberAddSchema = z.object({
  projectId: z.string().min(1),
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

export const projectUpdateDetailsSchema = z.object({
  projectId: z.string().min(1),
  status: z.nativeEnum(ProjectStatus),
  description: z.string().max(20000).optional(),
  webLinksJson: z.string(),
  documentLinksJson: z.string(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectMemberAddInput = z.infer<typeof projectMemberAddSchema>;
export type ProjectUrlEntry = z.infer<typeof projectUrlEntrySchema>;
