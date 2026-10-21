import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadGroupLibrary,
  newChatGroup,
  recoverGroup,
  removeGroup,
  saveGroupLibrary,
} from './group-store';
import type { GroupLibrary } from './group-store';
import type { PersonId, Project } from './model';

interface History {
  past: Project[];
  future: Project[];
}
export function useProject(notify: (text: string) => void) {
  const [library, setLibrary] = useState(loadGroupLibrary);
  const current = useRef(library);
  const histories = useRef(new Map<string, History>());
  const [saved, setSaved] = useState<'saving' | 'saved' | 'error'>('saved');
  const commit = useCallback((next: GroupLibrary) => {
    if (next === current.current) return;
    current.current = next;
    setLibrary(next);
    setSaved('saving');
  }, []);
  const getHistory = useCallback((id: string) => {
    let history = histories.current.get(id);
    if (!history) {
      history = { past: [], future: [] };
      histories.current.set(id, history);
    }
    return history;
  }, []);
  const edit = useCallback(
    (transform: (p: Project) => Project, groupId = current.current.activeId) => {
      const group = current.current.groups.find((g) => g.id === groupId);
      if (!group) return;
      const project = transform(group.project);
      if (project === group.project) return;
      const history = getHistory(groupId);
      history.past = [...history.past.slice(-49), group.project];
      history.future = [];
      commit({
        ...current.current,
        groups: current.current.groups.map((g) =>
          g.id === groupId ? { ...g, project, updatedAt: Date.now() } : g,
        ),
      });
    },
    [commit, getHistory],
  );
  const undo = useCallback(() => {
    const id = current.current.activeId;
    const group = current.current.groups.find((g) => g.id === id)!;
    const history = getHistory(id);
    const previous = history.past.pop();
    if (!previous) return;
    history.future.push(group.project);
    commit({
      ...current.current,
      groups: current.current.groups.map((g) =>
        g.id === id ? { ...g, project: previous, updatedAt: Date.now() } : g,
      ),
    });
  }, [commit, getHistory]);
  const redo = useCallback(() => {
    const id = current.current.activeId;
    const group = current.current.groups.find((g) => g.id === id)!;
    const history = getHistory(id);
    const next = history.future.pop();
    if (!next) return;
    history.past.push(group.project);
    commit({
      ...current.current,
      groups: current.current.groups.map((g) =>
        g.id === id ? { ...g, project: next, updatedAt: Date.now() } : g,
      ),
    });
  }, [commit, getHistory]);
  const selectGroup = useCallback(
    (id: string) => {
      if (id !== current.current.activeId && current.current.groups.some((g) => g.id === id))
        commit({ ...current.current, activeId: id });
    },
    [commit],
  );
  const createGroup = useCallback(
    (name: string, otherName: string) => {
      if (!name.trim()) return;
      const source = current.current.groups.find((g) => g.id === current.current.activeId)!.project;
      const group = newChatGroup(name, otherName, source);
      commit({
        ...current.current,
        groups: [...current.current.groups, group],
        activeId: group.id,
      });
    },
    [commit],
  );
  const setGroupDraft = useCallback(
    (person: PersonId, draft: string) => {
      const id = current.current.activeId;
      commit({
        ...current.current,
        groups: current.current.groups.map((g) =>
          g.id === id ? { ...g, drafts: { ...g.drafts, [person]: draft } } : g,
        ),
      });
    },
    [commit],
  );
  const renameGroup = useCallback(
    (id: string, name: string) => {
      if (!name.trim()) return;
      commit({
        ...current.current,
        groups: current.current.groups.map((g) =>
          g.id === id ? { ...g, name: name.trim().slice(0, 40), updatedAt: Date.now() } : g,
        ),
      });
    },
    [commit],
  );
  const deleteGroup = useCallback(
    (id: string) => {
      commit(removeGroup(current.current, id));
    },
    [commit],
  );
  const restoreGroup = useCallback(
    (id: string) => {
      commit(recoverGroup(current.current, id));
    },
    [commit],
  );
  useEffect(() => {
    const persist = () => {
      try {
        saveGroupLibrary(current.current);
        setSaved('saved');
      } catch {
        setSaved('error');
        notify('本地空间不足，最新修改尚未保存。请减少图片，暂时不要关闭页面。');
      }
    };
    const timer = window.setTimeout(persist, 450);
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', persist);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', persist);
    };
  }, [library, notify]);
  const activeGroup = library.groups.find((g) => g.id === library.activeId)!;
  const history = histories.current.get(library.activeId);
  return {
    project: activeGroup.project,
    edit,
    undo,
    redo,
    canUndo: Boolean(history?.past.length),
    canRedo: Boolean(history?.future.length),
    saved,
    groups: library.groups,
    activeGroup,
    activeId: library.activeId,
    trash: library.trash,
    selectGroup,
    createGroup,
    renameGroup,
    deleteGroup,
    restoreGroup,
    setGroupDraft,
  };
}
