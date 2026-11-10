import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
	return readFile(new URL(relativePath, root), 'utf8');
}

function parseDeclarations(block) {
	return Object.fromEntries(
		block
			.split(';')
			.map((item) => item.trim())
			.filter(Boolean)
			.map((item) => {
				const separator = item.indexOf(':');
				return [item.slice(0, separator).trim(), item.slice(separator + 1).trim()];
			}),
	);
}

async function assertFloorBadgeLayout(relativePath) {
	const css = await read(relativePath);
	const rules = [...css.matchAll(/\.linuxfloor\s*\{([^}]*)\}/g)].map((match) => parseDeclarations(match[1]));

	assert.equal(rules.length, 1, `${relativePath} 应只有一份 .linuxfloor 规则`);
	const rule = rules[0];

	assert.equal(rule.width, 'auto', `${relativePath}: 楼层徽标宽度需随数字增长，不能固定为 30px`);
	assert.equal(rule['min-width'], '30px', `${relativePath}: 短楼层号仍需保持 30px 的最小宽度`);
	assert.equal(rule['white-space'], 'nowrap', `${relativePath}: 楼层号不能换行`);
	assert.equal(rule['flex-shrink'], '0', `${relativePath}: 楼层徽标在 .post-infos 中不能被压回固定宽度`);
	assert.equal(rule['box-sizing'], 'border-box', `${relativePath}: 内边距需计入宽度`);
	assert.equal(rule.padding, '0 6px', `${relativePath}: 长楼层号需有水平内边距`);
}

test('页面注入样式中的楼层徽标可容纳多位楼层号', async () => {
	await assertFloorBadgeLayout('entrypoints/App.vue');
});

test('content 样式中的楼层徽标可容纳多位楼层号', async () => {
	await assertFloorBadgeLayout('entrypoints/app.css');
});
