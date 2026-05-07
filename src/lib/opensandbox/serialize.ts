import type { SandboxInfo } from "@alibaba-group/opensandbox";

export function serializeSandboxInfo(info: SandboxInfo) {
  return {
    ...info,
    createdAt: toIso(info.createdAt),
    expiresAt: info.expiresAt ? toIso(info.expiresAt) : null,
  };
}

export function serializeDateRecord<T extends Record<string, unknown>>(record: T) {
  return JSON.parse(
    JSON.stringify(record, (_key, value) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    }),
  ) as T;
}

export function serializeJson<T>(value: T) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (item instanceof Date) return item.toISOString();
      return item;
    }),
  ) as T;
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}
