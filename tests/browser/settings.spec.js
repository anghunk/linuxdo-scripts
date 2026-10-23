import { test as base, expect, chromium } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const extensionPath = path.resolve('.output/chrome-mv3');
const origin = 'https://linux.do';
const settingsKey = 'linuxdoscriptssettingDMI';

const test = base.extend({
	extensionContext: async ({}, use) => {
		const profile = await mkdtemp(path.join(tmpdir(), 'linuxdo-settings-test-'));
		const context = await chromium.launchPersistentContext(profile, {
			channel: 'chromium',
			executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
			headless: true,
			args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
		});
		try {
			// 全部请求留在测试环境，不连接真实论坛，也不读取用户浏览器资料。
			await context.route('**/*', (route) => route.fulfill({
				contentType: route.request().isNavigationRequest() ? 'text/html' : 'application/json',
				body: route.request().isNavigationRequest()
					? '<!doctype html><html><head><title>Settings test</title></head><body><div id="main-outlet"></div></body></html>'
					: '{}',
			}));
			await use(context);
		} finally {
			await context.close();
			await rm(profile, { recursive: true, force: true, maxRetries: 5 });
		}
	},
});

async function seed(page, value, version = 1) {
	await page.goto(`${origin}/raw/settings-test`);
	await page.evaluate(({ value, version, settingsKey }) => new Promise((resolve, reject) => {
		const request = indexedDB.open('LinuxDoScriptsDB', version);
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains('settings')) {
				request.result.createObjectStore('settings', { keyPath: 'key' });
			}
		};
		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const db = request.result;
			const tx = db.transaction('settings', 'readwrite');
			tx.objectStore('settings').put({ key: settingsKey, value, timestamp: Date.now() });
			tx.oncomplete = () => { db.close(); resolve(); };
			tx.onabort = () => { db.close(); reject(tx.error); };
		};
	}), { value, version, settingsKey });
}

async function readSettings(page) {
	return page.evaluate((settingsKey) => new Promise((resolve, reject) => {
		const request = indexedDB.open('LinuxDoScriptsDB');
		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const db = request.result;
			const tx = db.transaction('settings');
			const get = tx.objectStore('settings').get(settingsKey);
			tx.oncomplete = () => { db.close(); resolve(get.result?.value ?? null); };
			tx.onabort = () => { db.close(); reject(tx.error); };
		};
	}), settingsKey);
}

async function openSettings(page) {
	await page.goto(`${origin}/settings-test`);
	await page.locator('.linuxdoscripts-setting').click();
	await expect(page.locator('button.save')).toBeEnabled();
}

const checkbox = (page, text) => page.locator('#linuxdoscripts .item').filter({ hasText: text }).locator('input[type=checkbox]').first();

test('保存并刷新后设置保留，重复保存和无修改保存均不会回退', async ({ extensionContext }) => {
	const page = await extensionContext.newPage();
	await seed(page, { checked1: false, checked19: false, customField: 'keep' });
	await openSettings(page);
	await checkbox(page, '是否新标签页打开话题').check();
	await Promise.all([
		page.waitForEvent('load'),
		page.locator('button.saveload').click(),
	]);
	await page.locator('.linuxdoscripts-setting').click();
	await expect(checkbox(page, '是否新标签页打开话题')).toBeChecked();
	await checkbox(page, '编辑器切换 ja 字体').check();
	await page.locator('button.save').click();
	await expect(page.locator('#menu_suspendedball')).toBeHidden();
	await page.reload();
	await page.locator('.linuxdoscripts-setting').click();
	await expect(checkbox(page, '编辑器切换 ja 字体')).toBeChecked();
	await page.locator('button.save').click();
	const stored = await readSettings(page);
	expect(stored.checked1).toBe(true);
	expect(stored.checked19).toBe(true);
	expect(stored.customField).toBe('keep');
});

test('两个真实标签页编辑不同设置，旧面板保存不会覆盖另一页面', async ({ extensionContext }) => {
	const a = await extensionContext.newPage();
	await seed(a, { checked1: false, checked19: false });
	await openSettings(a);
	const b = await extensionContext.newPage();
	await openSettings(b);
	await checkbox(a, '是否新标签页打开话题').check();
	await a.locator('button.save').click();
	await expect(a.locator('#menu_suspendedball')).toBeHidden();
	await checkbox(b, '编辑器切换 ja 字体').check();
	await b.locator('button.save').click();
	await expect(b.locator('#menu_suspendedball')).toBeHidden();
	const stored = await readSettings(a);
	expect(stored.checked1).toBe(true);
	expect(stored.checked19).toBe(true);
	await a.reload();
	await a.locator('.linuxdoscripts-setting').click();
	await expect(checkbox(a, '是否新标签页打开话题')).toBeChecked();
	await expect(checkbox(a, '编辑器切换 ja 字体')).toBeChecked();
});

test('真实数据库读取异常时显示错误、禁用保存并保留原设置和旧数据', async ({ extensionContext }) => {
	const page = await extensionContext.newPage();
	await seed(page, { checked1: true, marker: 'preserved' }, 2);
	await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ checked1: false })), settingsKey);
	await page.goto(`${origin}/settings-test`);
	await page.locator('.linuxdoscripts-setting').click();
	await expect(page.getByText('设置读取失败，现有数据未被覆盖。请重试。')).toBeVisible();
	await expect(page.locator('button.save')).toBeDisabled();
	await expect(page.locator('button.saveload')).toBeDisabled();
	await page.getByRole('button', { name: '重新加载' }).click();
	await expect(page.getByText('设置读取失败，现有数据未被覆盖。请重试。')).toBeVisible();
	expect(await readSettings(page)).toEqual({ checked1: true, marker: 'preserved' });
	expect(await page.evaluate((key) => localStorage.getItem(key), settingsKey)).not.toBeNull();
});

test('保存失败时不会刷新，面板保留未提交的修改', async ({ extensionContext }) => {
	const page = await extensionContext.newPage();
	await seed(page, { checked1: false });
	await openSettings(page);
	await checkbox(page, '是否新标签页打开话题').check();
	// 在初始化后升级数据库，令扩展后续以旧版本打开时失败。
	await page.evaluate(() => new Promise((resolve, reject) => {
		const request = indexedDB.open('LinuxDoScriptsDB', 2);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => { request.result.close(); resolve(); };
	}));
	let navigations = 0;
	page.on('framenavigated', () => { navigations += 1; });
	await page.locator('button.saveload').click();
	await expect(page.getByText('保存失敗，請檢查控制台獲取詳細信息')).toBeVisible();
	await expect(page.locator('#menu_suspendedball')).toBeVisible();
	await expect(checkbox(page, '是否新标签页打开话题')).toBeChecked();
	expect(navigations).toBe(0);
	expect((await readSettings(page)).checked1).toBe(false);
});
