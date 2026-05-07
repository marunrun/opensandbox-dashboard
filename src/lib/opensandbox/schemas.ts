import { z } from "zod";

export const createSandboxSchema = z.object({
  image: z.string().min(1),
  timeoutSeconds: z.number().int().positive().nullable().optional(),
  entrypoint: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
  resource: z.record(z.string()).optional(),
  skipHealthCheck: z.boolean().optional(),
  readyTimeoutSeconds: z.number().int().positive().optional(),
});

export const listSandboxSchema = z.object({
  state: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const renewSandboxSchema = z.object({
  timeoutSeconds: z.number().int().positive(),
});

export const commandSchema = z.object({
  command: z.string().min(1),
  workingDirectory: z.string().optional(),
  timeoutSeconds: z.number().int().positive().optional(),
  background: z.boolean().optional(),
});

export const endpointSchema = z.object({
  port: z.coerce.number().int().positive().max(65535),
});

export const fileReadSchema = z.object({
  path: z.string().min(1),
});

export const fileWriteSchema = z.object({
  path: z.string().min(1),
  data: z.string(),
  mode: z.number().int().positive().optional(),
});

export const fileSearchSchema = z.object({
  path: z.string().min(1),
  pattern: z.string().optional(),
});

export const egressPatchSchema = z.object({
  rules: z.array(
    z.object({
      action: z.enum(["allow", "deny"]),
      target: z.string().min(1),
    }),
  ),
});
