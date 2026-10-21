import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from './model';
import {
  GROUP_STORAGE_KEY,
  loadGroupLibrary,
  migrateProject,
  newChatGroup,
  recoverGroup,
  removeGroup,
  saveGroupLibrary,
} from './group-store';

function withStorage(run: (data: Map<string, string>) => void) {
  const data = new Map<string, string>();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    },
  });
  try {
    run(data);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
}

test('migrating an existing chat retains all messages, people and device settings', () =>
  withStorage((data) => {
    const project = createProject();
    project.people.other.name = '原来的联系人';
    project.devices.other.battery = 23;
    const original = JSON.stringify(project);
    data.set('dialog-studio:project:v1', original);
    const library = loadGroupLibrary();
    assert.equal(library.groups.length, 1);
    assert.deepEqual(library.groups[0].project, project);
    assert.equal(library.activeId, library.groups[0].id);
    saveGroupLibrary(library);
    assert.equal(data.get('dialog-studio:project:v1'), original, 'legacy backup is preserved');
    assert.deepEqual(loadGroupLibrary(), library);
  }));

test('a new group starts empty, inherits self and device preferences without sharing mutable data', () => {
  const source = createProject();
  const group = newChatGroup(' 客户聊天 ', ' 张三 ', source);
  assert.equal(group.name, '客户聊天');
  assert.equal(group.project.people.other.name, '张三');
  assert.deepEqual(group.project.messages, []);
  assert.deepEqual(group.project.people.self, source.people.self);
  assert.deepEqual(group.project.devices, source.devices);
  group.project.people.self.name = '另一组的自己';
  group.project.devices.self.battery = 7;
  assert.notEqual(source.people.self.name, '另一组的自己');
  assert.notEqual(source.devices.self.battery, 7);
});

test('switching the active group and reloading retain each independent chat and unsent draft', () =>
  withStorage(() => {
    const library = migrateProject(createProject());
    const second = newChatGroup('张三', '张三', library.groups[0].project);
    second.drafts.self = '暂时还没发出的消息';
    second.project.messages.push({
      id: 'second-only',
      sender: 'self',
      type: 'text',
      text: '只在第二组',
    });
    library.groups.push(second);
    library.activeId = second.id;
    saveGroupLibrary(library);
    const restored = loadGroupLibrary();
    assert.equal(restored.activeId, second.id);
    assert.equal(restored.groups[1].drafts.self, '暂时还没发出的消息');
    assert.equal(restored.groups[1].project.messages[0].id, 'second-only');
    assert.equal(
      restored.groups[0].project.messages.some((m) => m.id === 'second-only'),
      false,
    );
  }));

test('deleting and restoring a group preserve its entire conversation and original position', () => {
  const library = migrateProject(createProject());
  const second = newChatGroup('张三', '张三', library.groups[0].project);
  second.drafts.other = '未发送';
  library.groups.push(second);
  library.activeId = second.id;
  const deleted = removeGroup(library, second.id);
  assert.equal(deleted.groups.length, 1);
  assert.equal(deleted.activeId, library.groups[0].id);
  assert.deepEqual(deleted.trash[0].group, second);
  assert.equal(library.groups.length, 2, 'source snapshot is never mutated');
  const restored = recoverGroup(deleted, second.id);
  assert.deepEqual(restored.groups, library.groups);
  assert.equal(restored.activeId, second.id);
  assert.equal(restored.trash.length, 0);
});

test('the last remaining group cannot be deleted and missing IDs are harmless', () => {
  const library = migrateProject(createProject());
  assert.equal(removeGroup(library, library.activeId), library);
  assert.equal(removeGroup(library, 'missing'), library);
  assert.equal(recoverGroup(library, 'missing'), library);
});

test('invalid active IDs recover to a real group; deleted groups survive a reload', () =>
  withStorage((data) => {
    const library = migrateProject(createProject());
    const second = newChatGroup('张三', '张三', library.groups[0].project);
    library.groups.push(second);
    const deleted = removeGroup(library, second.id);
    saveGroupLibrary({ ...deleted, activeId: 'missing' });
    const restored = loadGroupLibrary();
    assert.equal(restored.activeId, library.groups[0].id);
    assert.equal(restored.trash[0].group.id, second.id);
    assert.ok(data.has(GROUP_STORAGE_KEY));
  }));
