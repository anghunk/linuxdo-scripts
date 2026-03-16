<template>
	<div>
		<div class="el-button" @click="togglePopupSize" title="等级查询">
			<span>等级</span>
		</div>
		<div v-if="!isMinimized" id="linuxDoLevelPopupContent">
			<div v-html="content"></div>
			<input v-model="username" autocomplete="off" type="text" placeholder="请输入用户名..." id="linuxDoUserSearch" />

			<!-- 按钮组 -->
			<div class="button-group">
				<button @click="handleSearch" class="btn btn-primary" type="button">
					<span class="d-button-label">查询等级（不限）</span>
				</button>
				<button @click="fetchConnectData" class="btn btn-connect" type="button">
					<span class="d-button-label">Connect 数据（本人）</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import $ from 'jquery';
import { fetchConnectData } from '../../utilities/connectApi.js';

export default {
	data() {
		return {
			url: window.location.origin,
			isMinimized: true,
			content: '输入用户名查询等级信息',
			username: '',
			levelDescriptions: {
				0: '游客',
				1: '基本用户',
				2: '成员',
				3: '活跃用户',
				4: '领导者',
			},
			levelRequirements: {
				0: { topics_entered: 5, posts_read_count: 30, time_read: 600 },
				1: {
					days_visited: 15,
					likes_given: 1,
					likes_received: 1,
					post_count: 3,
					topics_entered: 20,
					posts_read_count: 100,
					time_read: 3600,
				},
				2: {
					days_visited: 50,
					likes_given: 30,
					likes_received: 20,
					post_count: 10,
					topics_entered: 0,
					posts_read_count: 0,
				},
			},
			usernameTimer: null,
		};
	},
	methods: {
		// 获取 Connect API 数据并提取 card 元素
		async fetchConnectData() {
			try {
				this.content = '正在获取 Connect 数据，请勿进行其他操作...';

				const response = await fetchConnectData('/');

				if (response.success) {
					// 从返回的 HTML 中提取所有 card 元素
					const cardsHtml = this.extractCardsFromHtml(response.data);

					if (cardsHtml) {
						this.content = cardsHtml;
					} else {
						// Connect 中不存在 card 元素，给出提示并调用默认查询
						this.content =
							"<strong style='color: orange;'>Connect 数据中未找到卡片信息，正在切换到常规查询模式...</strong>";
						setTimeout(() => {
							this.handleSearch();
						}, 1000);
					}
				} else {
					// Connect API 请求失败，给出提示并调用默认查询
					this.content = "<strong style='color: red;'>Connect API 请求失败，正在切换到常规查询模式...</strong>";
					setTimeout(() => {
						this.handleSearch();
					}, 1000);
				}
			} catch (error) {
				// 发生异常，给出提示并调用默认查询
				console.error('Connect API 请求异常：', error);
				this.content = "<strong style='color: red;'>Connect API 请求异常，正在切换到常规查询模式...</strong>";
				setTimeout(() => {
					this.handleSearch();
				}, 1000);
			}
		},

		// 从 HTML 字符串中提取所有 <div class="card"> 元素
		extractCardsFromHtml(htmlString) {
			try {
				const parser = new DOMParser();
				const doc = parser.parseFromString(htmlString, 'text/html');

				// 查找所有 class 包含 card 的 div 元素
				const cards = doc.querySelectorAll('div.card');

				if (cards.length > 0) {
					// 将所有 card 元素的 outerHTML 拼接起来
					return Array.from(cards)
						.map((card) => card.outerHTML)
						.join('');
				}

				return null;
			} catch (error) {
				console.error('解析 HTML 时出错：', error);
				return null;
			}
		},

		async fetchAboutData() {
			try {
				const response = await fetch(`${this.url}/about.json`, {
					headers: {
						Accept: 'application/json',
						'User-Agent': 'Mozilla/5.0',
					},
					method: 'GET',
				});
				if (!response.ok) throw new Error(`HTTP 错误！状态：${response.status}`);
				return await response.json();
			} catch (error) {
				console.error('获取关于页面数据失败：', error);
				this.displayError('获取关于页面数据失败');
				return null;
			}
		},
		async fetchUserData(username) {
			try {
				const response = await fetch(`${this.url}/u/${username}/summary.json`, {
					headers: {
						Accept: 'application/json',
						'User-Agent': 'Mozilla/5.0',
					},
					method: 'GET',
				});
				if (!response.ok) throw new Error(`HTTP 错误！状态：${response.status}`);
				return await response.json();
			} catch (error) {
				console.error('获取用户数据失败：', error);
				this.displayError('获取用户数据失败');
				return null;
			}
		},
		async handleSearch() {
			if (this.username == '') {
				return false;
			}
			this.content = '正在查询中，请勿进行其他操作...';
			const username = this.username.trim();
			if (username) {
				const aboutData = await this.fetchAboutData();
				const userData = await this.fetchUserData(username);
				if (userData && aboutData) {
					const userSummary = userData.user_summary;
					const user = userData.users[0];
					const status = aboutData.about.stats;
					this.updatePopupContent(userSummary, user, status);
				}
			}
		},
		updatePopupContent(userSummary, user, status) {
			if (userSummary && user) {
				let content = `<strong>信任等级：</strong>${
					this.levelDescriptions[user.trust_level]
				}<br><strong>升级进度：</strong><br>`;

				if (user.trust_level === 3) {
					content += `联系管理员以升级到领导者<br>`;
				} else if (user.trust_level === 4) {
					content += `您已是最高信任等级<br>`;
				} else {
					const requirements = this.levelRequirements[user.trust_level];
					if (user.trust_level === 2) {
						requirements.posts_read_count = Math.min(Math.floor(status.posts_30_days / 4), 20000);
						requirements.topics_entered = Math.min(Math.floor(status.topics_30_days / 4), 500);
					}

					Object.entries(requirements).forEach(([key, val]) => {
						const currentVal = userSummary[key] || 0;
						const color = currentVal >= val ? 'green' : 'red';
						content += `${this.translateStat(key)}: <span style="color: ${color};">${currentVal} / ${val}</span><br>`;
					});
				}

				this.content = content;
			}
		},
		togglePopupSize() {
			this.isMinimized = !this.isMinimized;
		},
		displayError(message) {
			this.content = `<strong>错误：</strong>${message}`;
		},
		translateStat(stat) {
			const translations = {
				days_visited: '访问天数',
				likes_given: '给出的赞',
				likes_received: '收到的赞',
				post_count: '帖子数量',
				posts_read_count: '阅读的帖子数',
				topics_entered: '进入的主题数',
				time_read: '阅读时间',
			};

			return translations[stat] || stat;
		},
		clearTimer() {
			if (this.usernameTimer) {
				clearInterval(this.usernameTimer);
				this.usernameTimer = null;
			}
		},
	},
	created() {
		this.usernameTimer = setInterval(() => {
			if (!this.username) {
				const avatarImg = $('#toggle-current-user img.avatar');
				const src = avatarImg.length ? avatarImg.attr('src') : null;
				if (src) {
					if (window.location.hostname === 'linux.do') {
						const match = src.match(/\/user_avatar\/linux\.do\/([^\/]+)/);
						if (match && match[1]) {
							this.username = match[1];
						}
					} else if (window.location.hostname === 'idcflare.com') {
						const match = src.match(/\/user_avatar\/idcflare\.com\/([^\/]+)/);
						if (match && match[1]) {
							this.username = match[1];
						}
					}
				}
			}
		}, 1000);
	},
	beforeUnmount() {
		this.clearTimer();
	},
	beforeDestroy() {
		this.clearTimer();
	},
};
</script>

<style scoped lang="less">
@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes pulse {
	0% {
		box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4);
	}
	70% {
		box-shadow: 0 0 0 10px rgba(var(--primary-rgb), 0);
	}
	100% {
		box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0);
	}
}

.minimized {
	width: 50px !important;
	height: 50px !important;
	border-radius: 50% !important;
	padding: 0 !important;
	overflow: hidden;
	cursor: pointer;
	animation: pulse 2s infinite;
}

#linuxDoLevelPopupContent {
	line-height: 1.6;
	position: fixed;
	bottom: 20px;
	right: 90px;
	width: 450px;
	background-color: var(--secondary);
	padding: 20px;
	z-index: 10000;
	font-size: 14px;
	border-radius: 12px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	animation: fadeIn 0.3s ease-out;
	border: 1px solid var(--primary-low);
	box-sizing: border-box;
	max-height: 80vh;
	overflow-y: auto;

	* {
		box-sizing: border-box;
	}

	strong {
		color: var(--primary);
		font-weight: 600;
	}
}

#linuxDoUserSearch {
	width: 100%;
	margin-top: 15px;
	padding: 10px 12px;
	border: 2px solid var(--primary-low);
	border-radius: 8px;
	font-size: 14px;
	transition: all 0.3s ease;

	&:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
	}
}

// 按钮组样式
.button-group {
	display: flex;
	gap: 8px;
	margin-top: 10px;

	.btn {
		flex: 1;
		padding: 10px 16px;
		font-size: 13px;
		font-weight: 500;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;

		.d-button-label {
			position: relative;
			z-index: 1;
		}

		&.btn-primary {
			color: #fff;
			background: linear-gradient(135deg, var(--primary) 0%, var(--primary-medium) 100%);
			box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.2);

			&:hover {
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
			}
		}

		&.btn-connect {
			color: #fff;
			background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
			box-shadow: 0 2px 8px rgba(23, 162, 184, 0.2);

			&:hover {
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
			}
		}

		&:active {
			transform: translateY(0);
		}
	}
}

.minimize-button {
	position: absolute;
	top: 8px;
	right: 8px;
	z-index: 10001;
	background: transparent;
	border: none;
	cursor: pointer;
	border-radius: 50%;
	text-align: center;
	line-height: 32px;
	width: 32px;
	height: 32px;
	color: var(--primary);
	transition: all 0.3s ease;

	&:hover {
		background: var(--primary-low);
	}
}

@media (max-width: 768px) {
	#linuxDoLevelPopupContent {
		width: calc(100vw - 80px);
		right: auto;
		left: 10px;
	}
}
</style>

<style lang="less">
:root {
	--bg-primary: #ffffff;
	--bg-secondary: #f5f5f5;
	--bg-tertiary: #ebebeb;
	--bg-page: #f0f0f0;
	--bg-hover: #e8e8e8;
	--bg-input: #ffffff;
	--text-primary: #111111;
	--text-secondary: #555555;
	--text-tertiary: #888888;
	--text-inverse: #ffffff;
	--border-color: #e0e0e0;
	--border-strong: #cccccc;
	--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
	--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
	--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
	--accent: #111111;
	--accent-hover: #333333;
	--accent-text: #ffffff;
	--success: #22c55e;
	--success-bg: #f0fdf4;
	--danger: #ef4444;
	--danger-hover: #dc2626;
	--danger-bg: #fef2f2;
	--warning: #f59e0b;
	--warning-bg: #fffbeb;
	--info: #6366f1;
	--info-bg: #eef2ff;
	--link: #0ea5e9;
	--card-bg: var(--bg-primary);
	--card-border: var(--border-color);
	--nav-bg: var(--bg-primary);
	--nav-border: var(--border-color);
	--badge-bg: var(--bg-tertiary);
	--badge-text: var(--text-secondary);
	--input-border: var(--border-strong);
	--input-focus: var(--accent);
	--footer-bg: transparent;
	--footer-text: var(--text-tertiary);
	--code-bg: var(--bg-secondary);
	--dot-color: rgba(0, 0, 0, 0.07);
	--dot-size: 1px;
	--grid-color: rgba(0, 0, 0, 0.03);
	--grid-gap: 32px;
	--sp-0: 0;
	--sp-0h: 2px;
	--sp-1: 4px;
	--sp-1h: 6px;
	--sp-2: 8px;
	--sp-2h: 10px;
	--sp-3: 12px;
	--sp-3h: 14px;
	--sp-4: 16px;
	--sp-4h: 18px;
	--sp-5: 20px;
	--sp-6: 24px;
	--sp-7: 28px;
	--sp-8: 32px;
	--sp-9: 36px;
	--sp-10: 40px;
	--text-xs: 12px;
	--text-sm: 13px;
	--text-base: 14px;
	--text-md: 15px;
	--text-lg: 16px;
	--text-xl: 18px;
	--text-2xl: 20px;
	--text-3xl: 22px;
	--text-4xl: 28px;
	--content-max-width: 1592px;
	--radius-sm: 6px;
	--radius-md: 10px;
	--radius-lg: 16px;
	--radius-pill: 9999px;
	--transition-theme: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

[data-theme='dark'] {
	--bg-primary: #141414;
	--bg-secondary: #1c1c1c;
	--bg-tertiary: #262626;
	--bg-page: #0a0a0a;
	--bg-hover: #2a2a2a;
	--bg-input: #1a1a1a;
	--text-primary: #f0f0f0;
	--text-secondary: #a0a0a0;
	--text-tertiary: #666666;
	--text-inverse: #111111;
	--border-color: #2a2a2a;
	--border-strong: #3a3a3a;
	--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
	--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
	--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
	--accent: #f0f0f0;
	--accent-hover: #d4d4d4;
	--accent-text: #111111;
	--success-bg: #0a2e14;
	--danger-hover: #f87171;
	--danger-bg: #2e0a0a;
	--warning-bg: #2e2a0a;
	--info: #a5b4fc;
	--info-bg: #2d2d5e;
	--link: #38bdf8;
	--card-bg: var(--bg-secondary);
	--code-bg: var(--bg-tertiary);
	--dot-color: rgba(255, 255, 255, 0.06);
	--grid-color: rgba(255, 255, 255, 0.03);
}

#linuxDoLevelPopupContent {
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 3px var(--sp-2h);
		font-size: var(--text-xs);
		font-weight: 600;
		border-radius: var(--radius-pill);
		background-color: var(--badge-bg);
		color: var(--badge-text);
		line-height: 1.5;
	}

	.badge-success {
		background-color: var(--success-bg);
		color: var(--success);
	}

	.card {
		transition: var(--transition-theme);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0;
	}

	.card-hover:hover {
		box-shadow: var(--shadow-md);
	}

	.card-title {
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.card-subtitle {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin: 0;
	}

	.tl3-section-title {
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		margin-bottom: var(--sp-4);
		margin-top: var(--sp-5);
	}

	.tl3-section-title:first-of-type {
		margin-top: 0;
	}

	.tl3-rings {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--sp-5);
		margin-bottom: var(--sp-5);
	}

	.tl3-ring {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-2);
	}

	.tl3-ring-circle {
		position: relative;
		width: 88px;
		height: 88px;
		border-radius: 50%;
	}

	.tl3-ring-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
	}

	.tl3-ring-svg circle {
		fill: none;
		stroke-width: 8;
	}

	.tl3-ring-track-path {
		stroke: var(--bg-tertiary);
	}

	.tl3-ring-progress-path {
		stroke: var(--ring-color);
		stroke-linecap: round;
		stroke-dasharray: 238.76;
		animation: tl3RingSvg 0.8s cubic-bezier(0.2, 0, 0, 1) forwards;
	}

	.tl3-ring:nth-child(2) .tl3-ring-progress-path {
		animation-delay: 0.1s;
	}

	.tl3-ring:nth-child(3) .tl3-ring-progress-path {
		animation-delay: 0.2s;
	}

	.tl3-ring-circle.met {
		--ring-color: #22c55e;
	}

	.tl3-ring-circle.unmet {
		--ring-color: #f59e0b;
	}

	.tl3-ring-value {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 1;
	}

	.tl3-ring-current {
		font-size: 12px;
		font-weight: 700;
		line-height: 1.2;
		color: var(--text-primary);
	}

	.tl3-ring-circle.met .tl3-ring-current {
		color: var(--success);
	}

	.tl3-ring-circle.unmet .tl3-ring-current {
		color: var(--warning);
	}

	.tl3-ring-target {
		font-size: 10px;
		line-height: 1.2;
		color: var(--text-tertiary);
	}

	.tl3-ring-label {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		text-align: center;
	}

	.tl3-bars {
		display: flex;
		flex-direction: column;
		gap: var(--sp-3h);
		margin-bottom: var(--sp-5);
	}

	.tl3-bar-item {
		display: flex;
		flex-direction: column;
		gap: var(--sp-1h);
	}

	.tl3-bar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.tl3-bar-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}

	.tl3-bar-nums {
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.tl3-bar-nums.met {
		color: var(--success);
	}

	.tl3-bar-nums.unmet {
		color: var(--warning);
	}

	.tl3-bar-track {
		height: 8px;
		background: var(--bg-tertiary);
		border-radius: 4px;
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
	}

	.tl3-bar-fill {
		height: 100%;
		border-radius: 4px;
		position: relative;
		overflow: visible;
		--bp: calc(min(var(--val) / var(--max), 1));
		width: calc(var(--bp) * 100%);
		animation: tl3BarFill 0.7s cubic-bezier(0.2, 0, 0, 1.08) forwards;
	}

	.tl3-bar-fill::after {
		content: '';
		position: absolute;
		right: -2px;
		top: -1px;
		bottom: -1px;
		width: 6px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.9);
		box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.6);
		opacity: 0;
		animation: tl3BarTip 0.7s cubic-bezier(0.2, 0, 0, 1.08) forwards;
	}

	.tl3-bar-item:first-child .tl3-bar-fill,
	.tl3-bar-item:first-child .tl3-bar-fill::after {
		animation-delay: 0.1s;
	}

	.tl3-bar-item:nth-child(2) .tl3-bar-fill,
	.tl3-bar-item:nth-child(2) .tl3-bar-fill::after {
		animation-delay: 0.2s;
	}

	.tl3-bar-item:nth-child(3) .tl3-bar-fill,
	.tl3-bar-item:nth-child(3) .tl3-bar-fill::after {
		animation-delay: 0.3s;
	}

	.tl3-bar-item:nth-child(4) .tl3-bar-fill,
	.tl3-bar-item:nth-child(4) .tl3-bar-fill::after {
		animation-delay: 0.4s;
	}

	.tl3-bar-item:nth-child(5) .tl3-bar-fill,
	.tl3-bar-item:nth-child(5) .tl3-bar-fill::after {
		animation-delay: 0.5s;
	}

	.tl3-bar-fill.met {
		background: linear-gradient(90deg, #22c55e, #4ade80);
		box-shadow:
			0 0 8px rgba(34, 197, 94, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.tl3-bar-fill.unmet {
		background: linear-gradient(90deg, #f59e0b, #fbbf24);
		box-shadow:
			0 0 8px rgba(245, 158, 11, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.tl3-quota {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--sp-3);
		margin-bottom: var(--sp-3);
	}

	.tl3-quota-card {
		padding: var(--sp-3) var(--sp-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
		transition: var(--transition-theme);
	}

	.tl3-quota-card.unmet {
		border-color: rgba(239, 68, 68, 0.2);
		background: var(--danger-bg);
	}

	.tl3-quota-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--sp-2h);
	}

	.tl3-quota-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}

	.tl3-quota-nums {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-tertiary);
	}

	.tl3-quota-card.unmet .tl3-quota-nums {
		color: var(--danger);
	}

	.tl3-slots {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.tl3-slot {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: var(--success);
		opacity: 0.25;
	}

	.tl3-slot.used {
		background: var(--danger);
		opacity: 0.8;
		box-shadow: 0 0 6px rgba(239, 68, 68, 0.3);
		animation: tl3SlotBreak 0.6s ease-out both;
	}

	.tl3-slot.used:first-child {
		animation-delay: 0.2s;
	}

	.tl3-slot.used:nth-child(2) {
		animation-delay: 0.35s;
	}

	.tl3-slot.used:nth-child(3) {
		animation-delay: 0.5s;
	}

	.tl3-slot.used:nth-child(4) {
		animation-delay: 0.65s;
	}

	.tl3-slot.used:nth-child(5) {
		animation-delay: 0.8s;
	}

	.tl3-slot.used:nth-child(6) {
		animation-delay: 0.95s;
	}

	.tl3-slot.used:nth-child(7) {
		animation-delay: 1.1s;
	}

	.tl3-slot.used:nth-child(8) {
		animation-delay: 1.25s;
	}

	.tl3-slot.used:nth-child(9) {
		animation-delay: 1.4s;
	}

	.tl3-slot.used:nth-child(10) {
		animation-delay: 1.55s;
	}

	.tl3-slot-overflow {
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--danger);
		flex-shrink: 0;
		margin-left: var(--sp-1);
	}

	.tl3-veto {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--sp-3);
		margin-bottom: var(--sp-5);
	}

	.tl3-veto-item {
		perspective: 600px;
		height: 64px;
	}

	.tl3-veto-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: var(--transition-theme);
	}

	.tl3-veto-item.unmet .tl3-veto-inner {
		animation: tl3VetoFlip 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both;
	}

	.tl3-veto-item.unmet:nth-child(2) .tl3-veto-inner {
		animation-delay: 0.6s;
	}

	.tl3-veto-face {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		padding: var(--sp-3) var(--sp-4);
		border-radius: var(--radius-md);
		border: 1px solid;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.tl3-veto-front {
		background: var(--success-bg);
		border-color: rgba(34, 197, 94, 0.2);
	}

	.tl3-veto-back {
		background: var(--danger-bg);
		border-color: rgba(239, 68, 68, 0.2);
		transform: rotateX(-180deg);
	}

	.tl3-veto-icon {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.tl3-veto-front .tl3-veto-icon {
		background: rgba(34, 197, 94, 0.15);
		color: var(--success);
	}

	.tl3-veto-back .tl3-veto-icon {
		background: rgba(239, 68, 68, 0.15);
		color: var(--danger);
	}

	.tl3-veto-icon svg {
		width: 14px;
		height: 14px;
		stroke: currentColor;
		fill: none;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.tl3-veto-body {
		flex: 1;
		min-width: 0;
	}

	.tl3-veto-label {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
	}

	.tl3-veto-desc {
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}

	.tl3-veto-value {
		font-size: var(--text-lg);
		font-weight: 700;
		flex-shrink: 0;
	}

	.tl3-veto-front .tl3-veto-value {
		color: var(--success);
	}

	.tl3-veto-back .tl3-veto-value {
		color: var(--danger);
	}

	.divider {
		height: 1px;
		background: var(--border-color);
		border: none;
		margin: 0 0 var(--sp-5);
	}
}

@keyframes tl3RingSvg {
	from {
		stroke-dashoffset: 238.76;
	}
}

@keyframes tl3BarFill {
	from {
		--bp: 0;
	}
}

@keyframes tl3BarTip {
	0% {
		opacity: 0;
	}

	15% {
		opacity: 1;
	}

	85% {
		opacity: 1;
	}

	100% {
		opacity: 0;
	}
}

@keyframes tl3SlotBreak {
	0% {
		background: var(--success);
		opacity: 0.25;
		transform: scaleY(1);
		box-shadow: none;
	}

	25% {
		background: var(--success);
		opacity: 0.6;
		transform: scaleY(1.6);
	}

	40% {
		background: #fff;
		opacity: 0.9;
		transform: scaleY(2);
	}

	55% {
		background: var(--danger);
		opacity: 0;
		transform: scaleY(0.4);
	}

	100% {
		background: var(--danger);
		opacity: 0.8;
		transform: scaleY(1);
		box-shadow: 0 0 6px rgba(239, 68, 68, 0.3);
	}
}

@keyframes tl3VetoFlip {
	0% {
		transform: rotateX(0);
	}

	40% {
		transform: rotateX(95deg);
	}

	70% {
		transform: rotateX(170deg);
	}

	85% {
		transform: rotateX(185deg);
	}

	100% {
		transform: rotateX(180deg);
	}
}
</style>
