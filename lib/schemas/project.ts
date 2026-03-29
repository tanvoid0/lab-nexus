import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().max(120).optional(),
});

export const projectMemberAddSchema = z.object({
  projectId: z.string().min(1),
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectMemberAddInput = z.infer<typeof projectMemberAddSchema>;
