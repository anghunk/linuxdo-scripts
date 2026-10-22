<template>
	<div
		v-if="visible"
		ref="panel"
		class="titlekeyword-panel"
		:style="panelStyle"
		@keydown="onPanelKeydown"
		@keyup.stop
		@keypress.stop
	>
		<div class="tk-header">
			<span>添加屏蔽词</span>
			<span class="tk-close" title="关闭" @click="close">×</span>
		</div>
		<p class="tk-hint">点选标题里的字词，相邻的会合并成一个词</p>
		<div class="tk-tokens">
			<template v-for="(token, index) in tokens" :key="index">
				<button
					v-if="token.word"
					type="button"
					class="tk-token"
					:class="{ active: selected.includes(index) }"
					@click="toggleToken(index)"
				>
					{{ token.text }}
				</button>
				<span v-else-if="token.text.trim()" class="tk-punct">{{ token.text }}</span>
			</template>
		</div>

		<div v-if="config.aiEnable" class="tk-row">
			<span class="tk-label">AI 推荐</span>
			<span v-if="ai.status === 'nokey'" class="tk-muted">请先在设置中填写 TypeSafe API Key</span>
			<span v-else-if="ai.status === 'loading'" class="tk-muted">分析中…</span>
			<span v-else-if="ai.status === 'error'" class="tk-error">
				{{ ai.error }}
				<a class="tk-link" @click="runAI(true)">重试</a>
			</span>
			<span v-else-if="ai.status === 'done' && ai.items.length === 0" class="tk-muted">没有合适的词</span>
			<button
				v-for="item in ai.items"
				:key="item.text"
				type="button"
				class="tk-chip"
				:class="{ active: isRangeSelected(item) }"
				@click="toggleRange(item)"
			>
				{{ item.text }}<small>{{ Math.round(item.prob * 100) }}%</small>
			</button>
		</div>

		<div class="tk-custom">
			<input v-model="customInput" type="text" placeholder="自定义屏蔽词，回车添加" @keydown.enter.prevent="addCustom" />
			<button type="button" class="tk-btn" @click="addCustom">添加</button>
		</div>

		<div class="tk-row">
			<span class="tk-label">将屏蔽</span>
			<span v-if="finalKeywords.length === 0" class="tk-muted">尚未选择</span>
			<span v-for="keyword in finalKeywords" :key="keyword.text" class="tk-chip active">
				{{ keyword.text }}<span class="tk-remove" title="移除" @click="removeKeyword(keyword)">×</span>
			</span>
		</div>
		<p v-if="hasSingleChar" class="tk-warn">单个汉字会屏蔽大量话题，建议连同相邻的字一起选</p>

		<div class="tk-footer">
			<button type="button" class="tk-btn" @click="close">取消</button>
			<button
				type="button"
				class="tk-btn tk-primary"
				:disabled="finalKeywords.length === 0 || saving"
				@click="confirm"
			>
				屏蔽所选{{ finalKeywords.length ? `（${finalKeywords.length}）` : '' }}
			</button>
		</div>
	</div>
</template>

<script>
import $ from 'jquery';
import settingsManager from '../../utilities/settingsManager.js';
import {
	appendKeywords,
	buildCandidates,
	isJoinable,
	removeTopicsByKeywords,
	suggestKeywordsWithTypeSafe,
	tokenizeTitle,
} from '../../utilities/titleKeywords.js';
import { isUserPage } from '../../utilities/url';

const AI_MAX_ITEMS = 5;
const AI_MIN_PROB = 0.02;

export default {
	props: {
		// 设置项 titleKeywordBlock：{ enable, aiEnable, apikey, model }
		config: { type: Object, required: true },
	},
	// saved：屏蔽词已写入数据库，参数为最新的 blockkeywrod 文本
	emits: ['saved'],
	data() {
		return {
			visible: false,
			pos: null,
			topicId: '',
			title: '',
			category: '',
			tags: [],
			tokens: [],
			selected: [],
			extras: [],
			customInput: '',
			touched: false, // 用户动过选择后，AI 结果不再自动勾选
			saving: false,
			ai: { status: 'idle', items: [], error: '' },
		};
	},
	computed: {
		panelStyle() {
			return this.pos ? { top: `${this.pos.top}px`, left: `${this.pos.left}px` } : { visibility: 'hidden' };
		},
		// 选中的词块按相邻关系合并成词
		tileGroups() {
			const groups = [];
			let current = null;
			this.tokens.forEach((token, index) => {
				if (!token.word) return;
				if (!this.selected.includes(index)) {
					current = null;
					return;
				}
				if (current && isJoinable(this.title, current.end, token.start)) {
					current.end = token.end;
					current.idx.push(index);
				} else {
					current = { start: token.start, end: token.end, idx: [index] };
					groups.push(current);
				}
			});
			return groups.map((g) => ({ ...g, text: this.title.slice(g.start, g.end).trim() }));
		},
		finalKeywords() {
			const seen = new Set();
			const list = [];
			const add = (keyword) => {
				const key = keyword.text.toLowerCase();
				if (!keyword.text || seen.has(key)) return;
				seen.add(key);
				list.push(keyword);
			};
			this.tileGroups.forEach(add);
			this.extras.forEach((text) => add({ text }));
			return list;
		},
		hasSingleChar() {
			return this.finalKeywords.some((k) => /^[㐀-鿿豈-﫿]$/.test(k.text));
		},
	},
	methods: {
		// 提示组件
		messageToast(message) {
			const messageElement = document.createElement('div');
			messageElement.className = 'messageToast-text';
			messageElement.innerText = message;
			document.getElementById('messageToast').appendChild(messageElement);
			setTimeout(() => {
				messageElement.remove();
			}, 3000);
		},
		// 在话题标题后插入「屏蔽词」按钮，并保持在免打扰、预览按钮之后
		injectButtons() {
			if (isUserPage()) return;
			$('.topic-list .main-link a.title').each(function () {
				const id = $(this).attr('data-topic-id');
				const $line = $(this).closest('.link-top-line');
				if ($line.length < 1) return;
				const $btn = $line.find('.titlekeyword-btn');
				if ($btn.length < 1) {
					$line.append(
						`<button type="button" class="btn btn-icon-text btn-default titlekeyword-btn" data-id="${id}">屏蔽词</button>`,
					);
				} else if ($btn.nextAll('.donottopic-btn,.removedonottopic-btn,.topicpreview-btn').length) {
					$line.append($btn);
				}
			});
		},
		// DOM 变动频繁，合并成一次处理
		scheduleInject() {
			if (this.injectTimer) return;
			this.injectTimer = setTimeout(() => {
				this.injectTimer = null;
				this.injectButtons();
			}, 50);
		},
		open(btn) {
			const $row = $(btn).closest('tr.topic-list-item');
			const title = $(btn).closest('.link-top-line').find('a.title').first().text().trim();
			if (!title) return;

			this.requestSeq++;
			this.anchor = btn;
			this.topicId = $(btn).attr('data-id') || title;
			this.title = title;
			this.category = $row.find('.badge-category__name').first().text().trim();
			this.tags = $row
				.find('.discourse-tag')
				.map((i, el) => $(el).text().trim())
				.get()
				.filter(Boolean);
			this.tokens = tokenizeTitle(title);
			this.selected = [];
			this.extras = [];
			this.customInput = '';
			this.touched = false;
			this.ai = { status: 'idle', items: [], error: '' };
			this.pos = null;
			this.visible = true;

			if (this.config.aiEnable) this.runAI();
		},
		close() {
			this.visible = false;
			this.anchor = null;
			this.requestSeq++;
		},
		reposition() {
			if (!this.visible || !this.$refs.panel) return;
			if (!this.anchor || !document.body.contains(this.anchor)) {
				this.close();
				return;
			}
			const rect = this.anchor.getBoundingClientRect();
			const panel = this.$refs.panel;
			const width = panel.offsetWidth;
			const height = panel.offsetHeight;
			let top = rect.bottom + 6;
			if (top + height > window.innerHeight - 8) {
				// 下方放不下就翻到上方；上方也放不下则贴住视口底部（面板限高，内容可滚动）
				top = rect.top - height - 6 >= 8 ? rect.top - height - 6 : Math.max(8, window.innerHeight - height - 8);
			}
			const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
			// 位置不变时不赋值，避免 updated 钩子里反复渲染
			if (!this.pos || this.pos.top !== top || this.pos.left !== left) {
				this.pos = { top, left };
			}
		},
		async runAI(force = false) {
			if (!this.config.apikey) {
				this.ai = { status: 'nokey', items: [], error: '' };
				return;
			}
			const candidates = buildCandidates(this.title, this.tokens);
			if (candidates.length === 0) {
				this.ai = { status: 'done', items: [], error: '' };
				return;
			}

			const cacheKey = `${this.topicId}|${this.title}`;
			const seq = ++this.requestSeq;
			let result = force ? null : this.aiCache.get(cacheKey);
			if (!result) {
				this.ai = { status: 'loading', items: [], error: '' };
				try {
					result = await suggestKeywordsWithTypeSafe({
						apikey: this.config.apikey,
						model: this.config.model,
						title: this.title,
						category: this.category,
						tags: this.tags,
						candidates,
					});
					this.aiCache.set(cacheKey, result);
				} catch (error) {
					if (seq !== this.requestSeq) return;
					this.ai = { status: 'error', items: [], error: `AI 推荐失败：${error.message}` };
					return;
				}
			}
			// 面板已关闭或切换到别的话题
			if (seq !== this.requestSeq) return;

			const items = result.items.filter((item) => item.prob >= AI_MIN_PROB).slice(0, AI_MAX_ITEMS);
			this.ai = { status: 'done', items, error: '' };
			// 用户还没动过选择时，自动勾选 AI 最推荐的词
			if (!this.touched && items.length && items[0].prob > result.none) {
				this.selectRange(items[0]);
			}
		},
		toggleToken(index) {
			this.touched = true;
			if (this.selected.includes(index)) {
				this.selected = this.selected.filter((i) => i !== index);
			} else {
				this.selected = [...this.selected, index];
			}
		},
		rangeIndexes(range) {
			const indexes = [];
			this.tokens.forEach((token, index) => {
				if (token.word && token.start >= range.start && token.end <= range.end) indexes.push(index);
			});
			return indexes;
		},
		// 该词恰好是一个已选中的词（而不只是被更长的词包含）
		isRangeSelected(range) {
			return this.tileGroups.some((g) => g.start === range.start && g.end === range.end);
		},
		selectRange(range) {
			const missing = this.rangeIndexes(range).filter((i) => !this.selected.includes(i));
			this.selected = [...this.selected, ...missing];
		},
		toggleRange(range) {
			this.touched = true;
			if (this.isRangeSelected(range)) {
				const indexes = this.rangeIndexes(range);
				this.selected = this.selected.filter((i) => !indexes.includes(i));
				return;
			}
			// AI 推荐的词互相重叠（如「华住」与「华住会」），先取消与它重叠的已选词再选中
			const overlapped = this.tileGroups
				.filter((g) => g.start < range.end && g.end > range.start)
				.flatMap((g) => g.idx);
			this.selected = this.selected.filter((i) => !overlapped.includes(i));
			this.selectRange(range);
		},
		addCustom() {
			const words = this.customInput
				.split(/[,，]/)
				.map((word) => word.trim())
				.filter(Boolean);
			if (words.length === 0) return;
			this.touched = true;
			this.extras = [...this.extras, ...words.filter((word) => !this.extras.includes(word))];
			this.customInput = '';
		},
		removeKeyword(keyword) {
			this.touched = true;
			if (keyword.idx) {
				this.selected = this.selected.filter((i) => !keyword.idx.includes(i));
			} else {
				this.extras = this.extras.filter((text) => text !== keyword.text);
			}
		},
		async confirm() {
			const words = this.finalKeywords.map((k) => k.text);
			this.saving = true;
			try {
				// 基于数据库里的最新值追加（其他标签页可能刚加过词），也不会把设置面板里未保存的改动一并写入
				let added = [];
				const { success, value } = await settingsManager.modifySetting('blockkeywrod', (current) => {
					const result = appendKeywords(current, words);
					added = result.added;
					return result.value;
				});
				if (!success) {
					this.messageToast('保存屏蔽词失败，请重试！');
					return;
				}
				this.$emit('saved', value);
				const removed = removeTopicsByKeywords(words);
				this.messageToast(
					added.length
						? `已屏蔽「${added.join('、')}」，移除 ${removed} 个话题`
						: `所选的词已在屏蔽列表中，移除 ${removed} 个话题`,
				);
				this.close();
			} finally {
				this.saving = false;
			}
		},
		onButtonClick(event) {
			event.preventDefault();
			const btn = event.currentTarget;
			if (this.visible && this.anchor === btn) {
				this.close();
			} else {
				this.open(btn);
			}
		},
		onDocumentMousedown(event) {
			if (!this.visible) return;
			const path = event.composedPath();
			if (path.includes(this.$refs.panel)) return;
			if (path.some((el) => el.classList && el.classList.contains('titlekeyword-btn'))) return;
			this.close();
		},
		onDocumentKeydown(event) {
			if (this.visible && event.key === 'Escape') this.close();
		},
		// 阻止按键冒泡到论坛的快捷键处理
		onPanelKeydown(event) {
			event.stopPropagation();
			if (event.key === 'Escape') this.close();
		},
	},
	created() {
		// 非响应式的内部状态
		this.anchor = null;
		this.aiCache = new Map();
		this.requestSeq = 0;
		this.injectTimer = null;

		this.injectButtons();
		this.observer = new MutationObserver(this.scheduleInject);
		this.observer.observe(document.body, { childList: true, subtree: true });

		$(document).on('click.titlekeyword', '.titlekeyword-btn', this.onButtonClick);
		document.addEventListener('mousedown', this.onDocumentMousedown, true);
		document.addEventListener('keydown', this.onDocumentKeydown);
		window.addEventListener('scroll', this.reposition, { capture: true, passive: true });
		window.addEventListener('resize', this.reposition);
	},
	// 面板内容变化（打开、AI 结果、选中的词、提示）后重新定位，保证不超出视口
	updated() {
		this.reposition();
	},
	beforeUnmount() {
		if (this.observer) this.observer.disconnect();
		clearTimeout(this.injectTimer);
		$(document).off('click.titlekeyword');
		$('.titlekeyword-btn').remove();
		document.removeEventListener('mousedown', this.onDocumentMousedown, true);
		document.removeEventListener('keydown', this.onDocumentKeydown);
		window.removeEventListener('scroll', this.reposition, { capture: true });
		window.removeEventListener('resize', this.reposition);
	},
};
</script>

<style lang="less" scoped>
.titlekeyword-panel {
	position: fixed;
	z-index: 99998;
	width: 380px;
	max-width: calc(100vw - 16px);
	max-height: calc(100vh - 16px);
	max-height: calc(100dvh - 16px);
	overflow-y: auto;
	box-sizing: border-box;
	padding: 12px 14px;
	border: 1px solid var(--primary-low);
	border-radius: 8px;
	background: var(--secondary);
	color: var(--primary);
	font-size: 14px;
	line-height: 1.5;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

	button,
	input {
		font: inherit;
	}
}

.tk-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-weight: 600;
	font-size: 15px;
}

.tk-close {
	cursor: pointer;
	font-size: 20px;
	line-height: 1;
	color: var(--primary-medium);

	&:hover {
		color: var(--primary);
	}
}

.tk-hint {
	margin: 2px 0 8px;
	font-size: 12px;
	color: var(--primary-medium);
}

.tk-tokens {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
	padding-bottom: 10px;
	border-bottom: 1px solid var(--primary-low);
}

.tk-token,
.tk-chip {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 8px;
	border: 1px solid var(--primary-low);
	border-radius: 4px;
	background: transparent;
	color: var(--primary);
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		border-color: var(--tertiary);
	}

	&.active {
		border-color: var(--tertiary);
		background: var(--tertiary);
		color: var(--secondary);
	}

	small {
		font-size: 11px;
		opacity: 0.75;
	}
}

.tk-punct {
	color: var(--primary-medium);
}

.tk-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	margin-top: 10px;
}

.tk-label {
	font-size: 12px;
	color: var(--primary-medium);
	margin-right: 2px;
}

.tk-muted {
	font-size: 13px;
	color: var(--primary-medium);
}

.tk-error {
	font-size: 13px;
	color: var(--danger);
}

.tk-link {
	cursor: pointer;
	margin-left: 4px;
	color: var(--tertiary);
}

.tk-remove {
	cursor: pointer;
	margin-left: 2px;
	opacity: 0.8;

	&:hover {
		opacity: 1;
	}
}

.tk-warn {
	margin: 6px 0 0;
	font-size: 12px;
	color: var(--danger);
}

.tk-custom {
	display: flex;
	gap: 6px;
	margin-top: 10px;

	input {
		flex: 1;
		min-width: 0;
		padding: 4px 8px;
		border: 1px solid var(--primary-low-mid, var(--primary-low));
		border-radius: 4px;
		background: var(--secondary);
		color: var(--primary);
		outline: none;

		&:focus {
			border-color: var(--tertiary);
		}
	}
}

.tk-btn {
	padding: 4px 12px;
	border: 1px solid var(--primary-low);
	border-radius: 4px;
	background: var(--primary-very-low, transparent);
	color: var(--primary);
	cursor: pointer;

	&:hover {
		border-color: var(--tertiary);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.tk-primary {
	border-color: var(--tertiary);
	background: var(--tertiary);
	color: var(--secondary);
}

.tk-footer {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 12px;
}
</style>
