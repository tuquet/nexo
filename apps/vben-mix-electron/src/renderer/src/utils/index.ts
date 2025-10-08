// TODO: Define Group and Project interfaces in base-schema
// import type { Group, Project } from '#/lib/db/base-schema';

export function attachGroupLabelToProjects(
  projects: any[], // Project[],
  groups: any[], // Group[],
) {
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));
  return projects.map((p) => ({
    ...p,
    group: p.groupId ? groupMap.get(p.groupId) || '' : '',
  }));
}
