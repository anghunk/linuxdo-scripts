// 标题关键词工具：分词、候选词生成、按关键词屏蔽话题、TypeSafe AI 推荐
import $ from 'jquery';
import { isUserPage } from './url';

const segmenter =
	typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('zh-CN', { granularity: 'word' }) : null;

// 两个词块之间只隔着这些字符时，视为同一个词（如 Claude Code、GPT-4o）
const JOINABLE_GAP = /^[\s\-_.·+&]*$/;

// 不适合作为候选词开头或结尾的虚词
const STOP_WORDS = new Set(
	'的 了 吗 呢 吧 啊 呀 嘛 么 个 过 求 请问 请教 一下 一个 一张 一些 有没有 没有 有人 用过 怎么 如何 什么 大家 各位 佬友 佬们 还是 或者 以及 和 与 及 或 跟 是 在 把 被 给 对 就 都 也 还 又 很 太 我 你 他 她 它 这 那 这个 那个 我们 你们'.split(
		' ',
	),
);

const CJK_CHAR = /^[㐀-鿿豈-﫿]$/;

// 将用户填写的屏蔽词文本解析为数组（中英文逗号均可分隔）
export function parseKeywords(text) {
	return (text || '')
		.split(/[,，]/)
		.map((keyword) => keyword.trim())
		.filter(Boolean);
}

// 把新词追加到已有屏蔽词文本末尾，保留用户原有的书写格式
export function appendKeywords(text, keywords) {
	const existing = new Set(parseKeywords(text).map((k) => k.toLowerCase()));
	const added = keywords.filter((k) => !existing.has(k.toLowerCase()));
	if (added.length === 0) return { value: text || '', added };
	const base = (text || '').replace(/[\s,，]+$/, '');
	return { value: (base ? base + ',' : '') + added.join(','), added };
}

// 移除话题列表中标题包含关键词的话题，返回移除的数量；用户主页列的是该用户自己的话题，不屏蔽
export function removeTopicsByKeywords(keywords) {
	if (!keywords || keywords.length === 0 || isUserPage()) return 0;
	const lowered = keywords.map((k) => k.toLowerCase());
	const $rows = $('.topic-list .main-link .raw-topic-link>*')
		.filter((index, element) => {
			const text = $(element).text().toLowerCase();
			return lowered.some((keyword) => text.includes(keyword));
		})
		.parents('tr.topic-list-item');
	const count = $rows.length;
	$rows.remove();
	return count;
}

// 将标题切分为词块：[{ text, start, end, word }]
export function tokenizeTitle(title) {
	if (segmenter) {
		return [...segmenter.segment(title)].map((s) => ({
			text: s.segment,
			start: s.index,
			end: s.index + s.segment.length,
			word: !!s.isWordLike,
		}));
	}
	// 不支持 Intl.Segmenter 时：英文数字连写为一个词，中文逐字切分
	const tokens = [];
	const re = /[A-Za-z0-9]+|[㐀-鿿豈-﫿]|[^A-Za-z0-9㐀-鿿豈-﫿]+/g;
	let m;
	while ((m = re.exec(title))) {
		tokens.push({
			text: m[0],
			start: m.index,
			end: m.index + m[0].length,
			word: /[A-Za-z0-9㐀-鿿豈-﫿]/.test(m[0]),
		});
	}
	return tokens;
}

// 两个词块之间的间隔能否合并成一个词
export function isJoinable(title, prevEnd, nextStart) {
	return JOINABLE_GAP.test(title.slice(prevEnd, nextStart));
}

// 生成供 AI 挑选的候选词：由 1~4 个相邻词块组成，最多 limit 个
export function buildCandidates(title, tokens, limit = 200) {
	const words = tokens.filter((t) => t.word);
	const seen = new Set();
	const candidates = [];
	for (let len = 1; len <= 4; len++) {
		for (let i = 0; i + len <= words.length; i++) {
			const first = words[i];
			const last = words[i + len - 1];
			let joinable = true;
			for (let k = i + 1; k < i + len; k++) {
				if (!isJoinable(title, words[k - 1].end, words[k].start)) {
					joinable = false;
					break;
				}
			}
			if (!joinable) continue;
			if (STOP_WORDS.has(first.text) || STOP_WORDS.has(last.text)) continue;
			const text = title.slice(first.start, last.end).trim();
			if (text.length < 2 || text.length > 20) continue;
			if (len === 1 && CJK_CHAR.test(text)) continue;
			const key = text.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			candidates.push({ text, start: first.start, end: last.end });
			if (candidates.length >= limit) return candidates;
		}
	}
	return candidates;
}

const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
const NONE_OPTION = 'none_of_these';

// 调用 TypeSafe 的 Choice 问题，从候选词中挑出最适合屏蔽的词
// 返回 { items: 按概率排序的 [{ text, start, end, prob }], none: 「没有合适的词」的概率 }
export async function suggestKeywordsWithTypeSafe({ apikey, model, title, category, tags, candidates }) {
	const criteria = {};
	candidates.forEach((c) => {
		criteria[c.text] = null;
	});
	criteria[NONE_OPTION] = 'None of the candidates is a meaningful subject keyword';

	const state = { title };
	if (category) state.category = category;
	if (tags && tags.length) state.tags = tags;

	const body = {
		model: model || 'jev-latest',
		state,
		questions: {
			keyword: {
				type: 'choice',
				instructions: {
					question:
						'Which candidate is the best keyword to add to a block list, so the reader stops seeing posts about the same specific subject as `title`?',
					prefer: 'The most specific complete name or term: a brand, product, service, person, game, or topic name.',
					avoid: 'Generic verbs, quantities, request words, and fragments that cut a name in half.',
				},
				criteria,
			},
		},
	};

	const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
	// 通过 background script 发送请求，绕过 CORS 限制
	const response = await browserAPI.runtime.sendMessage({
		action: 'ai_api_proxy',
		url: TYPESAFE_URL,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apikey}`,
		},
		body,
	});

	if (!response || !response.success) {
		throw new Error(describeTypeSafeError(response));
	}

	const probabilities = response.data?.answers?.keyword?.probabilities || {};
	const byText = new Map(candidates.map((c) => [c.text, c]));
	const items = Object.entries(probabilities)
		.filter(([text]) => byText.has(text))
		.map(([text, prob]) => ({ ...byText.get(text), prob }))
		.sort((a, b) => b.prob - a.prob);
	return { items, none: probabilities[NONE_OPTION] || 0 };
}

function describeTypeSafeError(response) {
	if (!response) return '扩展后台无响应';
	const status = response.status;
	if (status === 401 || status === 403) return 'API Key 无效或缺失';
	if (status === 429) return '请求过于频繁，请稍后重试';
	if (status === 529) return 'TypeSafe 服务繁忙，请稍后重试';
	const detail = response.data?.detail;
	const message =
		(typeof detail === 'string' && detail) || detail?.message || (Array.isArray(detail) && detail[0]?.msg) || response.error;
	return status ? `HTTP ${status}${message ? '：' + message : ''}` : message || '未知错误';
}
