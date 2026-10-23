import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/browser',
	workers: 1,
	reporter: 'list',
	timeout: 30000,
	use: { screenshot: 'only-on-failure' },
});
