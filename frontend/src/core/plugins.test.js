import { describe, expect, it } from 'vitest';
import { createPluginRegistry, isAvailable, PluginError } from './plugins';

const CORE = ['live', 'devices', 'settings'];
const build = () => () => null;
const screen = (extra = {}) => ({ label: 'Detections', icon: 'M0 0', group: 'main', build, ...extra });

describe('createPluginRegistry', () => {
  it('collects plugin screens and slot items, tagged with their plugin', () => {
    const registry = createPluginRegistry(
      [
        { name: 'acme', screens: { detections: screen({ requires: 'acme.detections' }) } },
        { name: 'licence', slots: { 'settings.sections': [{ key: 'licence', label: 'Licence', build }] } },
      ],
      CORE,
    );

    expect(registry.screens.map((s) => [s.key, s.plugin, s.requires])).toEqual([
      ['detections', 'acme', 'acme.detections'],
    ]);
    expect(registry.slots['settings.sections'].map((s) => [s.key, s.plugin])).toEqual([['licence', 'licence']]);
  });

  it('is empty without plugins', () => {
    expect(createPluginRegistry([], CORE)).toEqual({ screens: [], slots: { 'settings.sections': [] } });
  });

  it.each([
    ['replace a core screen', [{ name: 'a', screens: { devices: screen() } }], 'redefines screen "devices"'],
    [
      'replace another plugin screen',
      [
        { name: 'a', screens: { detections: screen() } },
        { name: 'b', screens: { detections: screen() } },
      ],
      'redefines screen "detections"',
    ],
    [
      'replace a core settings section',
      [{ name: 'a', slots: { 'settings.sections': [{ key: 'about', label: 'About', build }] } }],
      'redefines "about"',
    ],
    ['use an unknown slot', [{ name: 'a', slots: { 'live.toolbar': [] } }], 'unknown slot'],
    ['use an unknown sidebar group', [{ name: 'a', screens: { x: screen({ group: 'top' }) } }], 'unknown group'],
    ['share a name', [{ name: 'a' }, { name: 'a' }], 'Two frontend plugins'],
  ])('refuses plugins that %s', (_, plugins, message) => {
    expect(() => createPluginRegistry(plugins, CORE)).toThrow(PluginError);
    expect(() => createPluginRegistry(plugins, CORE)).toThrow(message);
  });
});

describe('isAvailable', () => {
  it('shows items without `requires` always, the others only with their feature', () => {
    expect(isAvailable({}, new Set())).toBe(true);
    expect(isAvailable({ requires: 'acme.x' }, new Set())).toBe(false);
    expect(isAvailable({ requires: 'acme.x' }, new Set(['acme.x']))).toBe(true);
  });
});
