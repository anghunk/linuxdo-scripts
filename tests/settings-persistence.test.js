import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDBStorage } from '../entrypoints/utilities/indexedDBStorage.js';
import { getSettingsChanges } from '../entrypoints/utilities/settingsChanges.js';

globalThis.window = {};
const { SettingsManager } = await import('../entrypoints/utilities/settingsManager.js');
delete globalThis.window;

let storage;

beforeEach(() => {
	globalThis.indexedDB = new IDBFactory();
	const values = new Map();
	globalThis.localStorage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, String(value)),
		removeItem: (key) => values.delete(key),
	};
	storage = new IndexedDBStorage();
});

afterEach(() => {
	delete globalThis.indexedDB;
	delete globalThis.localStorage;
});

test('读取失败会向上传递，不进入旧数据迁移或默认初始化', async () => {
	await storage.saveSettings({ checked1: true });
	const originalRead = storage.getSettings.bind(storage);
	storage.getSettings = async () => { throw new Error('读取失败'); };
	localStorage.setItem(storage.settingsKey, JSON.stringify({ checked1: false }));
	const manager = new SettingsManager(storage);
	await assert.rejects(manager.getSettings(), /读取失败/);
	await assert.rejects(manager.initializeSettings({ checked1: false }), /读取失败/);
	assert.deepEqual(await originalRead(), { checked1: true });
	assert.notEqual(localStorage.getItem(storage.settingsKey), null);
});

test('首次初始化补入默认值，并保留已有的嵌套配置、数组和未知字段', async () => {
	const manager = new SettingsManager(storage);
	assert.deepEqual(await manager.initializeSettings({ checked1: false }), { checked1: false });
	await storage.saveSettings({ checked1: true, nested: { custom: true }, list: [3], future: 42 });
	assert.deepEqual(await manager.initializeSettings({ checked1: false, nested: { added: true }, list: [1, 2] }), {
		checked1: true, nested: { added: true, custom: true }, list: [3], future: 42,
	});
});

test('初始化使用事务内的最新记录，避免覆盖读取后发生的修改', async () => {
	await storage.saveSettings({ checked1: false });
	const originalRead = storage.getSettingsWithMigration.bind(storage);
	storage.getSettingsWithMigration = async () => {
		const stale = await originalRead();
		await storage.saveSettings({ checked1: true });
		return stale;
	};
	assert.deepEqual(await new SettingsManager(storage).initializeSettings({ checked1: false, checked4: false }), {
		checked1: true, checked4: false,
	});
});

test('两个管理器使用旧缓存修改不同字段，不会相互回退', async () => {
	await storage.saveSettings({ checked1: false, checked4: false, nested: { a: false, b: false } });
	const a = new SettingsManager(storage);
	const b = new SettingsManager(new IndexedDBStorage());
	await Promise.all([a.getSettings(), b.getSettings()]);
	assert.deepEqual(await Promise.all([
		a.updateSettings({ checked1: true, nested: { a: true } }),
		b.updateSettings({ checked4: true, nested: { b: true } }),
	]), [true, true]);
	assert.deepEqual(await storage.getSettings(), {
		checked1: true, checked4: true, nested: { a: true, b: true },
	});
});

test('后续读取从数据库获取最新值，调用方修改返回对象不会提前写入', async () => {
	await storage.saveSettings({ checked1: false, nested: { a: false } });
	const a = new SettingsManager(storage);
	const b = new SettingsManager(new IndexedDBStorage());
	const draft = await a.getSettings();
	draft.nested.a = true;
	assert.equal((await storage.getSettings()).nested.a, false);
	await b.setSetting('checked1', true);
	assert.equal((await a.getSettings()).checked1, true);
});

test('旧面板仅保存实际编辑字段，保留其他标签页写入的值', async () => {
	const initial = { checked1: false, nested: { a: false, b: false }, list: [1] };
	await storage.saveSettings(initial);
	const a = new SettingsManager(storage);
	const b = new SettingsManager(new IndexedDBStorage());
	await a.updateSettings({ checked1: true, nested: { a: true }, list: [1, 2] });
	const draft = structuredClone(initial);
	draft.nested.b = true;
	const changes = getSettingsChanges(initial, draft);
	assert.deepEqual(changes, { nested: { b: true } });
	assert.equal(await b.updateSettings(changes), true);
	assert.deepEqual(await storage.getSettings(), { checked1: true, nested: { a: true, b: true }, list: [1, 2] });
});

test('设置差异支持清空值、数组替换和嵌套配置，未修改字段不提交', () => {
	assert.deepEqual(getSettingsChanges(
		{ text: 'old', list: [1, 2], nested: { a: true, b: true }, nil: null },
		{ text: '', list: [], nested: { a: false, b: true }, nil: { enable: true } },
	), { text: '', list: [], nested: { a: false }, nil: { enable: true } });
	assert.deepEqual(getSettingsChanges({ a: [] }, { a: [] }), {});
});

test('原子更新中途抛错时事务回滚，原配置保留', async () => {
	await storage.saveSettings({ checked1: true });
	await assert.rejects(storage.modifySettings(() => { throw new Error('模拟修改失败'); }), /模拟修改失败/);
	assert.deepEqual(await storage.getSettings(), { checked1: true });
});

test('写请求成功后事务中止，不能返回保存成功', async () => {
	await storage.saveSettings({ checked1: true });
	const originalOpen = storage.openDBWithTimeout.bind(storage);
	storage.openDBWithTimeout = async () => {
		const db = await originalOpen();
		const originalTransaction = db.transaction.bind(db);
		db.transaction = (...args) => {
			const tx = originalTransaction(...args);
			if (args[1] === 'readwrite') {
				const originalStore = tx.objectStore.bind(tx);
				tx.objectStore = (...storeArgs) => {
					const store = originalStore(...storeArgs);
					const originalPut = store.put.bind(store);
					store.put = (...putArgs) => {
						const request = originalPut(...putArgs);
						request.addEventListener('success', () => tx.abort());
						return request;
					};
					return store;
				};
			}
			return tx;
		};
		return db;
	};
	await assert.rejects(storage.saveSettings({ checked1: false }), /aborted/);
	assert.deepEqual(await new IndexedDBStorage().getSettings(), { checked1: true });
});

test('保存与删除只在事务完成后返回，并关闭连接', async () => {
	const originalOpen = storage.openDBWithTimeout.bind(storage);
	const events = [];
	storage.openDBWithTimeout = async () => {
		const db = await originalOpen();
		const originalTransaction = db.transaction.bind(db);
		const originalClose = db.close.bind(db);
		db.transaction = (...args) => {
			const tx = originalTransaction(...args);
			tx.addEventListener('complete', () => events.push('commit'));
			return tx;
		};
		db.close = () => { events.push('close'); originalClose(); };
		return db;
	};
	await storage.saveSettings({ checked1: true });
	events.push('saved');
	await storage.removeSettings();
	events.push('removed');
	assert.deepEqual(events, ['commit', 'close', 'saved', 'commit', 'close', 'removed']);
	assert.equal(await storage.getSettings(), null);
});

test('迁移失败保留旧配置，成功提交后才清理旧键', async () => {
	const legacy = JSON.stringify({ checked1: true });
	localStorage.setItem('linxudoscriptssettingDMI', legacy);
	const originalModify = storage.modifySettings.bind(storage);
	storage.modifySettings = async () => { throw new Error('写入失败'); };
	await assert.rejects(storage.getSettingsWithMigration(), /写入失败/);
	assert.equal(localStorage.getItem('linxudoscriptssettingDMI'), legacy);
	storage.modifySettings = originalModify;
	assert.deepEqual(await storage.getSettingsWithMigration(), { checked1: true });
	assert.equal(localStorage.getItem('linxudoscriptssettingDMI'), null);
	assert.deepEqual(await storage.getSettings(), { checked1: true });
});

test('迁移不会覆盖另一页面刚创建的记录', async () => {
	localStorage.setItem(storage.settingsKey, JSON.stringify({ checked1: false }));
	const originalModify = storage.modifySettings.bind(storage);
	storage.modifySettings = async (modifier) => {
		await new IndexedDBStorage().saveSettings({ checked1: true });
		return originalModify(modifier);
	};
	assert.deepEqual(await storage.getSettingsWithMigration(), { checked1: true });
});

test('损坏的旧 JSON 不会被默认配置覆盖，也不会被删除', async () => {
	localStorage.setItem(storage.settingsKey, 'invalid json');
	await assert.rejects(new SettingsManager(storage).initializeSettings({ checked1: false }), SyntaxError);
	assert.equal(localStorage.getItem(storage.settingsKey), 'invalid json');
	assert.equal(await storage.getSettings(), null);
});

test('打开超时后迟到的数据库连接会关闭', async () => {
	let resolveOpening;
	let closed = false;
	storage.dbTimeout = 5;
	storage.openDB = () => new Promise((resolve) => { resolveOpening = resolve; });
	await assert.rejects(storage.openDBWithTimeout(), /timeout/);
	resolveOpening({ close: () => { closed = true; } });
	await new Promise((resolve) => setTimeout(resolve, 0));
	assert.equal(closed, true);
});

test('手动导入仍可显式替换完整配置，概要缓存使用独立键', async () => {
	const manager = new SettingsManager(storage);
	await storage.saveSettings({ checked1: false, old: true });
	assert.equal(await manager.saveSettings({ checked1: true }), true);
	await storage.saveSummaryCache([{ name: 'fixture', value: 'test' }]);
	assert.deepEqual(await storage.getSettings(), { checked1: true });
	assert.equal((await storage.getSummaryCache()).length, 1);
});
