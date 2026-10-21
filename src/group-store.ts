import { createProject, loadProject, normalizeProject, uid } from './model';
import type { PersonId, Project } from './model';

export interface ChatGroup {
  id: string;
  name: string;
  project: Project;
  drafts: Record<PersonId, string>;
  updatedAt: number;
}
export interface DeletedGroup {
  group: ChatGroup;
  index: number;
  deletedAt: number;
}
export interface GroupLibrary {
  version: 1;
  activeId: string;
  groups: ChatGroup[];
  trash: DeletedGroup[];
}
export const GROUP_STORAGE_KEY = 'dialog-studio:groups:v1';

export function migrateProject(project: Project): GroupLibrary {
  const group = {
    id: uid(),
    name: `与${project.people.other.name}的聊天`,
    project,
    drafts: { other: '', self: '' },
    updatedAt: Date.now(),
  };
  return { version: 1, activeId: group.id, groups: [group], trash: [] };
}
export function newChatGroup(name: string, otherName: string, source: Project): ChatGroup {
  const project = createProject();
  project.messages = [];
  project.people.self = { ...source.people.self };
  project.people.other.name = otherName.trim() || '对方';
  project.devices = structuredClone(source.devices);
  return {
    id: uid(),
    name: name.trim().slice(0, 40),
    project,
    drafts: { other: '', self: '' },
    updatedAt: Date.now(),
  };
}
export function removeGroup(library: GroupLibrary, id: string): GroupLibrary {
  if (library.groups.length <= 1) return library;
  const index = library.groups.findIndex((group) => group.id === id);
  if (index < 0) return library;
  const groups = library.groups.filter((group) => group.id !== id);
  return {
    ...library,
    groups,
    activeId:
      library.activeId === id ? groups[Math.min(index, groups.length - 1)].id : library.activeId,
    trash: [...library.trash, { group: library.groups[index], index, deletedAt: Date.now() }],
  };
}
export function recoverGroup(library: GroupLibrary, id: string): GroupLibrary {
  const deleted = library.trash.find((item) => item.group.id === id);
  if (!deleted || library.groups.some((group) => group.id === id)) return library;
  const groups = [...library.groups];
  groups.splice(Math.min(deleted.index, groups.length), 0, deleted.group);
  return {
    ...library,
    groups,
    activeId: id,
    trash: library.trash.filter((item) => item.group.id !== id),
  };
}
export function loadGroupLibrary(): GroupLibrary {
  try {
    const raw = JSON.parse(localStorage.getItem(GROUP_STORAGE_KEY) || 'null');
    if (raw?.version === 1 && Array.isArray(raw.groups) && raw.groups.length > 0) {
      const ids = new Set<string>();
      const normalize = (value: ChatGroup): ChatGroup | null => {
        if (
          !value ||
          typeof value.id !== 'string' ||
          !value.id ||
          ids.has(value.id) ||
          typeof value.name !== 'string' ||
          !value.project
        )
          return null;
        ids.add(value.id);
        return {
          id: value.id,
          name: value.name.trim().slice(0, 40) || '未命名分组',
          project: normalizeProject(value.project),
          drafts: {
            other: typeof value.drafts?.other === 'string' ? value.drafts.other : '',
            self: typeof value.drafts?.self === 'string' ? value.drafts.self : '',
          },
          updatedAt: Number(value.updatedAt) || Date.now(),
        };
      };
      const groups = raw.groups
        .map(normalize)
        .filter((group: ChatGroup | null): group is ChatGroup => group !== null);
      const trash: DeletedGroup[] = [];
      if (Array.isArray(raw.trash))
        for (const item of raw.trash) {
          const group = normalize(item?.group);
          if (group)
            trash.push({
              group,
              index: Math.max(0, Number(item.index) || 0),
              deletedAt: Number(item.deletedAt) || Date.now(),
            });
        }
      if (groups.length)
        return {
          version: 1,
          groups,
          trash,
          activeId: groups.some((group: ChatGroup) => group.id === raw.activeId)
            ? raw.activeId
            : groups[0].id,
        };
    }
  } catch {
    /* Keep the original single-chat draft as the migration fallback. */
  }
  return migrateProject(loadProject());
}
export function saveGroupLibrary(library: GroupLibrary) {
  localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(library));
}
