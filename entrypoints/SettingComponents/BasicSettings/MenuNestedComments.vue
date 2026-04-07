<template>
	<div class="item">
		<div class="tit">{{ sort }}. 默认树形评论（打开帖子时自动使用树形评论模式）</div>
		<input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />
	</div>
</template>

<script>
import $ from "jquery";

export default {
	props: ["modelValue", "sort"],
	emits: ["update:modelValue"],
	data() {
		return {
			processingUrl: false,
			intervalId: null,
			nestedStyleEl: null,
		};
	},
	created() {
		if (this.modelValue) {
			this.$nextTick(() => {
				// 处理当前URL
				this.redirectToNested();

				// 开始链接监控
				this.startLinkMonitoring();

				// 监听浏览器前进后退
				window.addEventListener("popstate", this.handlePopState);

				// 注入顶级评论分割线样式
				this.injectDividerStyle();
			});
		} else {
			// 开关关闭时，如果当前是树形评论URL，还原为普通URL
			this.$nextTick(() => {
				this.redirectToNormal();
			});
		}
	},
	methods: {
		/**
		 * 判断URL是否为普通话题详情页（非嵌套模式）
		 * 匹配 /t/topic/数字 格式
		 */
		isTopicUrl(url) {
			return /\/t\/topic\/\d+/.test(url) && !/\/nested\//.test(url);
		},

		/**
		 * 判断URL是否为树形评论模式
		 * 匹配 /nested/topic/数字 格式
		 */
		isNestedUrl(url) {
			return /\/nested\/topic\/\d+/.test(url);
		},

		/**
		 * 将普通话题URL转换为树形评论URL
		 */
		toNestedUrl(href) {
			const match = href.match(/\/t\/topic\/(\d+)/);
			if (!match) return null;
			const topicId = match[1];
			if (href.startsWith("http")) {
				const urlObj = new URL(href);
				return `${urlObj.protocol}//${urlObj.host}/nested/topic/${topicId}?sort=old`;
			}
			return `/nested/topic/${topicId}?sort=old`;
		},

		/**
		 * 将树形评论URL还原为普通话题URL
		 */
		toNormalUrl(href) {
			const match = href.match(/\/nested\/topic\/(\d+)/);
			if (!match) return null;
			const topicId = match[1];
			if (href.startsWith("http")) {
				const urlObj = new URL(href);
				return `${urlObj.protocol}//${urlObj.host}/t/topic/${topicId}`;
			}
			return `/t/topic/${topicId}`;
		},

		/**
		 * 开始监控页面上的所有链接
		 */
		startLinkMonitoring() {
			this.stopLinkMonitoring();

			// 立即处理一次
			this.modifyTopicLinks();

			// 设置定时监控，处理动态加载的内容
			this.intervalId = setInterval(() => {
				this.modifyTopicLinks();
			}, 1000);
		},

		/**
		 * 停止链接监控
		 */
		stopLinkMonitoring() {
			if (this.intervalId) {
				clearInterval(this.intervalId);
				this.intervalId = null;
			}
		},

		/**
		 * 修改页面上所有话题链接为树形评论链接
		 */
		modifyTopicLinks() {
			$("a").each((_, element) => {
				const $el = $(element);
				const href = $el.attr("href");

				if (!href) return;

				// 只处理普通话题链接（排除已经是 nested 的）
				if (!this.isTopicUrl(href)) return;

				const newUrl = this.toNestedUrl(href);
				if (newUrl) {
					$el.attr("href", newUrl);
				}
			});
		},

		/**
		 * 将页面上所有树形评论链接还原为普通话题链接
		 */
		revertTopicLinks() {
			$("a").each((_, element) => {
				const $el = $(element);
				const href = $el.attr("href");

				if (!href) return;

				if (!this.isNestedUrl(href)) return;

				const newUrl = this.toNormalUrl(href);
				if (newUrl) {
					$el.attr("href", newUrl);
				}
			});
		},

		/**
		 * 处理popstate事件（浏览器前进/后退按钮）
		 */
		handlePopState() {
			if (!this.processingUrl) {
				this.redirectToNested();
			}
		},

		/**
		 * 将当前页面URL重定向为树形评论模式
		 */
		redirectToNested() {
			if (this.processingUrl) return;
			this.processingUrl = true;

			try {
				const currentUrl = window.location.href;

				if (this.isTopicUrl(currentUrl)) {
					const newUrl = this.toNestedUrl(currentUrl);
					if (newUrl && currentUrl !== newUrl) {
						window.location.replace(newUrl);
					}
				}
			} finally {
				setTimeout(() => {
					this.processingUrl = false;
				}, 100);
			}
		},

		/**
		 * 将当前页面URL从树形评论模式还原为普通模式
		 */
		redirectToNormal() {
			if (this.processingUrl) return;
			this.processingUrl = true;

			try {
				const currentUrl = window.location.href;

				if (this.isNestedUrl(currentUrl)) {
					const newUrl = this.toNormalUrl(currentUrl);
					if (newUrl && currentUrl !== newUrl) {
						window.location.replace(newUrl);
					}
				}
			} finally {
				setTimeout(() => {
					this.processingUrl = false;
				}, 100);
			}
		},

		/**
		 * 注入顶级评论之间的分割线 CSS
		 */
		injectDividerStyle() {
			if (this.nestedStyleEl) return;
			const style = document.createElement("style");
			style.id = "linuxdo-nested-divider-style";
			style.textContent = `
				.nested-view__roots > .nested-post.--depth-0 + .nested-post.--depth-0 {
					border-top: 1px solid var(--primary-low, #e1e4e8);
					margin-top: 0.75em;
					padding-top: 1em;
				}
			`;
			document.head.appendChild(style);
			this.nestedStyleEl = style;
		},

		/**
		 * 移除分割线 CSS
		 */
		removeDividerStyle() {
			if (this.nestedStyleEl) {
				this.nestedStyleEl.remove();
				this.nestedStyleEl = null;
			}
		},
	},
	beforeUnmount() {
		this.stopLinkMonitoring();
		this.removeDividerStyle();
		window.removeEventListener("popstate", this.handlePopState);
	},
	beforeDestroy() {
		this.stopLinkMonitoring();
		this.removeDividerStyle();
		window.removeEventListener("popstate", this.handlePopState);
	},
	watch: {
		modelValue(newVal) {
			if (newVal) {
				this.redirectToNested();
				this.startLinkMonitoring();
				window.addEventListener("popstate", this.handlePopState);
				this.injectDividerStyle();
			} else {
				this.stopLinkMonitoring();
				window.removeEventListener("popstate", this.handlePopState);
				// 关闭时：还原页面链接并跳转回普通模式
				this.revertTopicLinks();
				this.removeDividerStyle();
				this.redirectToNormal();
			}
		},
	},
};
</script>

