import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FacebookGroup = {
  id: string;
  name: string;
  url: string;
  category: "iphone" | "laptop";
  enabled: boolean;
  notes: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseGroup(value: unknown, index: number): FacebookGroup {
  if (!isRecord(value)) {
    throw new Error(`Invalid group at index ${index}.`);
  }

  const enabled = value.enabled ?? true;
  const notes = value.notes ?? "";
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.url !== "string" ||
    (value.category !== "iphone" && value.category !== "laptop") ||
    typeof enabled !== "boolean" ||
    typeof notes !== "string"
  ) {
    throw new Error(`Invalid group fields at index ${index}.`);
  }

  try {
    const url = new URL(value.url);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "www.facebook.com" ||
      !/^\/groups\/[^/]+\/?$/.test(url.pathname)
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(`Invalid group URL at index ${index}.`);
  }

  return {
    id: value.id,
    name: value.name,
    url: value.url,
    category: value.category,
    enabled,
    notes,
  };
}

export function parseGroups(value: unknown): FacebookGroup[] {
  if (!isRecord(value) || !Array.isArray(value.groups)) {
    throw new Error("Expected an object with a groups array.");
  }

  const ids = new Set<string>();
  const groups = value.groups.map((item, index) => {
    const group = parseGroup(item, index);
    if (ids.has(group.id)) {
      throw new Error(`Duplicate group ID: ${group.id}.`);
    }
    ids.add(group.id);
    return group;
  });

  return groups.filter((group) => group.enabled);
}

export function getGroups(): FacebookGroup[] {
  try {
    const file = readFileSync(join(process.cwd(), "data", "groups.json"), "utf8");
    return parseGroups(JSON.parse(file));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    throw new Error(`Unable to load data/groups.json: ${message}`, { cause: error });
  }
}
