<template>
	<div>
		<p>
			<a style="color: #e00" href="https://linuxdo-scripts.zishu.me/guide/3-ai/ai-summary.html" target="_blank"
				>查看 AI 使用文档！</a
			>
		</p>
		<div class="item">
			<div class="tit">1. 是否开启 AI 主贴总结</div>
			<input type="checkbox" v-model="localChecked.value1" @change="handleChange" />
		</div>
		<div class="item">
			<div class="tit">2. 是否开启 AI 生成所有已加载回帖总结 (手动，注意 token 消耗)</div>
			<input type="checkbox" v-model="localChecked.summaryAll" @change="handleChange" />
		</div>
		<div class="item">
			<div class="tit">3. 是否显示手动总结按钮</div>
			<input type="checkbox" v-model="localChecked.btn" @change="handleChange" />
		</div>
		<!-- <div class="item">
			<div class="tit">4. 是否开启 AI 生成回复推荐</div>
			<input type="checkbox" v-model="localChecked.value2" @change="handleChange" />
		</div> -->
		<div class="item">
			<div class="tit">4. 新建话题使用 AI 生成标题</div>
			<input type="checkbox" v-model="localChecked.title" @change="handleChange" />
		</div>

		<!-- 配置信息卡片 -->
		<div class="config-card">
			<div class="config-title">配置信息</div>

			<div class="item">
				<div class="label">选择服务商：</div>
				<div class="info">
					<select v-model="localChecked.provider" @change="handleProviderChange">
						<option value="openai">OpenAI 通用格式</option>
						<option value="deepseek">DeepSeek</option>
					</select>
				</div>
			</div>

			<div class="item">
				<div class="label">API Key:</div>
				<div class="info">
					<input
						type="text"
						v-model="localChecked.apikey"
						@keydown="handleKeyDown"
						:placeholder="getApiKeyPlaceholder()"
					/>
				</div>
			</div>

			<div class="item">
				<div class="label">API URL:</div>
				<div class="info">
					<input
						type="text"
						v-model="localChecked.api_url"
						@keydown="handleKeyDown"
						:placeholder="getApiUrlPlaceholder()"
					/>
				</div>
			</div>

			<div class="item">
				<div class="label">模型名称：</div>
				<div class="info">
					<input
						type="text"
						v-model="localChecked.model"
						@keydown="handleKeyDown"
						:placeholder="getModelPlaceholder()"
					/>
				</div>
			</div>

			<div class="item">
				<div class="temperature">
					<label>温度（temperature）：{{ localChecked.temperature }}</label>
					<input
						type="range"
						:title="localChecked.temperature"
						v-model="localChecked.temperature"
						min="0"
						max="2"
						step="0.1"
						placeholder="0.7"
					/>
				</div>
				<input type="checkbox" v-model="localChecked.isTemPer" @change="handleChange" />
			</div>

			<!-- 进阶用法：自定义参数 -->
			<div class="item advanced-params">
				<div class="label">进阶用法：</div>
				<div class="info">
					<div class="advanced-header">
						<span>自定义请求参数 (JSON 格式)</span>
						<input type="checkbox" v-model="localChecked.enableCustomParams" @change="handleChange" />
					</div>
					<textarea
						v-model="localChecked.customParams"
						@keydown="handleKeyDown"
						placeholder='{
	"thinking": {
		"type": "enabled"
	}
}'
						class="custom-params-input"
						:disabled="!localChecked.enableCustomParams"
					></textarea>
					<div class="item" style="font-style: italic; color: #666; font-size: 14px">
						提示：输入的 JSON 将会合并到请求体中，可用于 DeepSeek 思考模式等进阶功能，如不了解请勿使用。
					</div>
				</div>
			</div>

			<div class="item" style="font-style: italic; color: #666; font-size: 14px">
				注意：请按照指定格式填写参数；不支持 http，请使用 https。
			</div>
			<button @click="testConnection" class="test-btn">测试连通性</button>
			<div v-if="connectionStatus" :class="['connection-status', connectionStatus.type]">
				{{ connectionStatus.message }}
			</div>
		</div>

		<div class="prompt">
			<div class="item">
				<div class="tit">6. 提示词配置</div>
			</div>

			<div class="item">
				<div class="tit">AI 总结主贴 prompt:</div>
				<textarea v-model="localChecked.prompt" @keydown="handleKeyDown"></textarea>
			</div>

			<div class="item">
				<div class="tit">AI 总结全部回帖 prompt:</div>
				<textarea v-model="localChecked.prompt3" @keydown="handleKeyDown"></textarea>
			</div>

			<div class="item">
				<div class="tit">AI 生成回复 prompt:</div>
				<textarea v-model="localChecked.prompt1" @keydown="handleKeyDown"></textarea>
			</div>

			<div class="item">
				<div class="tit">AI 生成标题 prompt:</div>
				<textarea v-model="localChecked.prompt2" @keydown="handleKeyDown"></textarea>
			</div>
		</div>
	</div>
</template>

<script>
import $ from 'jquery';
import { marked } from 'marked';
import storageCompat, { getSafeSettings } from '../../utilities/storageCompat.js';
import dbStorage from '../../utilities/indexedDBStorage.js';
export default {
	props: {
		value: {
			type: Object,
			default: {
				value1: false,
				// value2: false,
				title: false,
				summaryAll: false,
				btn: true,
				provider: 'openai',
				apikey: '',
				api_url: 'https://api.openai.com/v1/chat/completions',
				model: 'gpt-4o-mini',
				isTemPer: true,
				temperature: 0.7,
				enableCustomParams: false,
				customParams: '',
				prompt:
					'根据以下帖子内容进行总结，请使用 markdown 格式返回回答，没有字数限制，但要求文字精炼，简介准确，语言要求返回简体中文，并且进行中英文混排优化。可以通过编号列表（1，2，3）列出核心要点。注意不要输出标题，例如：核心要点总结，帖子总结等，直接输出文本段落。',
				prompt1:
					'根据以下帖子内容，帮我给作者写一条回复，简短，表明我的观点，用口语回复，不需要很正式。您可以通过讨论的方式进行回复，这将有助于引导其他用户或作者进行互动。',
				prompt2:
					'根据以下帖子内容，生成一个合适的标题用于社交论坛发布使用，格式要求：不要书名号或其他符号，只需要一句纯文本。尽量精简到 15 字以内，如果字数不够表达主题，可以适当多生成几个字。',
				prompt3:
					'我会输入一论坛的主贴及所有回复，你需要输出：1.主贴总结：简要概括主贴核心内容 (2-3 句)，2. 讨论分析：主要观点倾向和共识/分歧点，讨论氛围评估 3.代表性回复：引用几条有代表性的回复 (附用户名)，简述每条回复的代表性和价值 4.争议点标记：标记格式：⚠️ [用户名]: "引用内容"，简析争议原因和各方立场 5.简要评估：评估讨论的整体氛围（如：友善、学术性、对抗性等）注意：保持客观公正，注重实质内容分析，区分事实与观点',
			},
		},
	},
	data() {
		return {
			localChecked: this.value,
			connectionStatus: null,
			checkIntervalId: null, // 添加变量存储定时器 ID
			mainPostSummaryIntervalId: null, // 主贴总结按钮定时器
			summaryIntervalId: null, // 检查缓存和自动总结定时器
			allPostsSummaryIntervalId: null, // 回帖总结按钮定时器
			titleGenerationIntervalId: null, // 标题生成定时器
			observer: null,
		};
	},
	watch: {
		value(newValue) {
			this.localChecked = newValue;
			// 当数据更新时，重新初始化按钮逻辑
			this.reinitializeButtons();
		},
	},
	methods: {
		handleKeyDown(e) {
			if (e.altKey && e.key === '-') {
				e.preventDefault();
				e.stopPropagation();

				const el = e.target;
				const start = el.selectionStart;
				const end = el.selectionEnd;

				// 获取当前值
				const currentValue = el.value;
				// 创建新值
				const newValue = currentValue.substring(0, start) + '-' + currentValue.substring(end);

				// 手动修改输入框的值
				el.value = newValue;

				// 触发 input 事件来更新 v-model 绑定的数据
				el.dispatchEvent(new Event('input', { bubbles: true }));

				// 设置光标位置
				this.$nextTick(() => {
					el.selectionStart = el.selectionEnd = start + 1;
				});
			}
		},
		handleChange() {
			this.$emit('update:value', this.localChecked);
		},
		handleProviderChange() {
			// 切换服务商时不修改配置信息，仅触发数据更新
			this.handleChange();
		},
		getApiKeyPlaceholder() {
			const placeholders = {
				openai: 'sk-xxxxxxxx',
				deepseek: 'sk-xxxxxxxx',
			};
			return placeholders[this.localChecked.provider] || 'Enter API Key';
		},
		getApiUrlPlaceholder() {
			const placeholders = {
				openai: 'https://api.openai.com/v1/chat/completions',
				deepseek: 'https://api.deepseek.com/v1/chat/completions',
			};
			return placeholders[this.localChecked.provider] || 'Enter API URL';
		},
		getModelPlaceholder() {
			const placeholders = {
				openai: '模型，如：gpt-4o-mini',
				deepseek: '模型，如：deepseek-chat',
			};
			return placeholders[this.localChecked.provider] || 'Enter Model Name';
		},
		// 解析并获取自定义参数
		getCustomParams(config) {
			if (!config.enableCustomParams || !config.customParams) {
				return {};
			}
			try {
				return JSON.parse(config.customParams);
			} catch (error) {
				console.warn('自定义参数 JSON 解析失败：', error);
				return {};
			}
		},
		getTopicUrl(url) {
			const regex = /^(https:\/\/linux\.do\/t\/topic\/\d+)(\/\d+)?$/;
			const match = url.match(regex);
			return match ? match[1] : url;
		},
		// 是否开启手动生成
		setCreatedBtn() {
			// 主贴总结按钮受"是否显示手动总结按钮"控制
			if (this.localChecked.btn && this.localChecked.value1) {
				$('head').append('<style>.aicreated-btn{display:inline-flex!important;visibility:visible!important}</style>');
			}
			// 回帖总结按钮不受"是否显示手动总结按钮"控制
			if (this.localChecked.summaryAll) {
				$('head').append(
					'<style>.aicreated-all-btn{display:inline-flex!important;visibility:visible!important}</style>',
				);
			}
		},

		// 尝试多种方式插入按钮
		tryInsertButton(buttonHtml, buttonClass) {
			const selectors = ['#topic-title'];

			for (let selector of selectors) {
				const $target = $(selector);
				if ($target.length > 0) {
					$target.after(buttonHtml);
					return true;
				}
			}

			return false;
		},

		// 等待数据加载完成
		async waitForDataLoad() {
			// 等待一段时间让父组件的数据传递过来
			let attempts = 0;
			const maxAttempts = 50; // 最多等待 5 秒

			while (attempts < maxAttempts) {
				// 检查是否已经有真实的配置数据（不是默认值）
				if (
					this.localChecked &&
					(this.localChecked.apikey ||
						this.localChecked.value1 !== false ||
						// this.localChecked.value2 !== false ||
						this.localChecked.summaryAll !== false)
				) {
					return true;
				}

				await new Promise((resolve) => setTimeout(resolve, 100));
				attempts++;
			}

			return false;
		},

		// 重新初始化按钮逻辑
		reinitializeButtons() {
			// 清除现有的定时器
			this.clearAllTimers();

			// 重新启动按钮插入逻辑
			this.initializeButtonLogic();
		},

		// 清除所有定时器
		clearAllTimers() {
			if (this.checkIntervalId) {
				clearInterval(this.checkIntervalId);
				this.checkIntervalId = null;
			}
			if (this.mainPostSummaryIntervalId) {
				clearInterval(this.mainPostSummaryIntervalId);
				this.mainPostSummaryIntervalId = null;
			}
			if (this.summaryIntervalId) {
				clearInterval(this.summaryIntervalId);
				this.summaryIntervalId = null;
			}
			if (this.allPostsSummaryIntervalId) {
				clearInterval(this.allPostsSummaryIntervalId);
				this.allPostsSummaryIntervalId = null;
			}
			if (this.titleGenerationIntervalId) {
				clearInterval(this.titleGenerationIntervalId);
				this.titleGenerationIntervalId = null;
			}
		},

		// ===== AI 总结缓存管理方法 =====

		// 获取缓存数据（优先从 IndexedDB，回退到 localStorage）
		async getSummaryCache() {
			try {
				// 首先尝试从 IndexedDB 获取
				const cache = await dbStorage.getSummaryCache();
				if (cache && cache.length > 0) {
					return cache;
				}

				// 如果 IndexedDB 没有数据，尝试从 localStorage 获取并迁移
				const localData = localStorage.getItem('summaryCacheData');
				if (localData) {
					const parsedData = JSON.parse(localData);
					if (Array.isArray(parsedData) && parsedData.length > 0) {
						// 迁移到 IndexedDB
						await dbStorage.migrateSummaryCacheFromLocalStorage();
						return await dbStorage.getSummaryCache();
					}
				}

				return [];
			} catch (error) {
				console.error('获取缓存数据失败：', error);
				// 回退到 localStorage
				try {
					const localData = localStorage.getItem('summaryCacheData');
					return localData ? JSON.parse(localData) : [];
				} catch (fallbackError) {
					console.error('回退到 localStorage 也失败：', fallbackError);
					return [];
				}
			}
		},

		// 保存缓存数据到 IndexedDB
		async saveSummaryCache(cacheArray) {
			try {
				return await dbStorage.saveSummaryCache(cacheArray);
			} catch (error) {
				console.error('保存缓存到 IndexedDB 失败，回退到 localStorage：', error);
				// 回退到 localStorage
				try {
					const limitedCache = Array.isArray(cacheArray) ? cacheArray.slice(-20) : [];
					localStorage.setItem('summaryCacheData', JSON.stringify(limitedCache));
					return true;
				} catch (fallbackError) {
					console.error('回退到 localStorage 也失败：', fallbackError);
					return false;
				}
			}
		},

		// 添加或更新单个缓存项
		async addOrUpdateSummaryCache(topicUrl, summaryContent) {
			try {
				return await dbStorage.addOrUpdateSummaryCache(topicUrl, summaryContent);
			} catch (error) {
				console.error('添加/更新缓存失败，使用传统方法：', error);
				// 回退到传统方法
				try {
					const cache = await this.getSummaryCache();
					const existingIndex = cache.findIndex((item) => item.name === topicUrl);

					const newItem = {
						name: topicUrl,
						value: summaryContent,
						timestamp: Date.now(),
					};

					if (existingIndex !== -1) {
						cache[existingIndex] = newItem;
					} else {
						cache.push(newItem);
					}

					return await this.saveSummaryCache(cache);
				} catch (fallbackError) {
					console.error('传统方法也失败：', fallbackError);
					return false;
				}
			}
		},

		// 获取特定 URL 的缓存
		async getSummaryCacheByUrl(topicUrl) {
			try {
				return await dbStorage.getSummaryCacheByUrl(topicUrl);
			} catch (error) {
				console.error('获取特定缓存失败，使用传统方法：', error);
				// 回退到传统方法
				try {
					const cache = await this.getSummaryCache();
					const found = cache.find((item) => item.name === topicUrl);
					return found ? found.value : null;
				} catch (fallbackError) {
					console.error('传统方法也失败：', fallbackError);
					return null;
				}
			}
		},

		// 初始化按钮插入逻辑
		initializeButtonLogic() {
			// // AI 回复按钮
			// if (this.localChecked.value2) {
			// 	$('body').append(`
      //     <div class="aireply-popup">
      //       <textarea class="aireply-popup-text"></textarea>
      //       <button class="aireply-popup-close">关闭</button>
      //     </div>
      //   `);

			// 	this.checkIntervalId = setInterval(() => {
			// 		if ($('.aireplay-btn').length < 1) {
			// 			const buttonHtml = `<button class="aireplay-btn" type="button" style="display:inline-flex!important;">AI 回复</button>`;
			// 			this.tryInsertButton(buttonHtml, 'aireplay-btn');
			// 			$('.aireplay-btn').click(() => {
			// 				this.setAIRelpy();
			// 			});
			// 			$('.aireply-popup-close').click(() => {
			// 				$('.aireply-popup').hide();
			// 				$('.aireply-popup-text').html('AI 推荐回复正在生成中，请稍后。。。');
			// 			});
			// 		}
			// 	}, 1000);
			// }

			// 主贴总结功能
			if (this.localChecked.value1) {
				this.mainPostSummaryIntervalId = setInterval(() => {
					if (
						$('.aicreated-btn').length < 1 &&
						this.localChecked.btn // 只有当开启手动按钮时才显示
					) {
						const buttonHtml = `<button class="aicreated-btn" type="button" style="display:inline-flex!important;">AI 总结主贴</button>`;
						this.tryInsertButton(buttonHtml, 'aicreated-btn');
						$('.aicreated-btn').click(() => {
							$('.gpt-summary-wrap').remove();
							// 使用参数 false 表示只总结主贴
							this.getPostContent(false);
						});
					}
				}, 1000);

				this.summaryIntervalId = setInterval(async () => {
					if ($('.post-stream').length > 0) {
						// 从 IndexedDB 获取缓存数据
						if ($('.gpt-summary-wrap').length < 1) {
							const regex = /^(https:\/\/linux\.do\/t\/topic\/\d+)(\/\d+)?$/;

							// 确保 URL 匹配正确的格式
							if (window.location.href.match(regex)) {
								const match = window.location.href.match(regex)[1];

								// 使用新的缓存管理方法
								const cachedContent = await this.getSummaryCacheByUrl(match);

								if (cachedContent) {
									$('.post-stream').before(
										`<div class="gpt-summary-wrap">
<div class="gpt-summary">${marked.parse(cachedContent)}</div>
</div>`,
									);
								}
							}
						}

						if (!this.localChecked.btn) {
							if ($('.gpt-summary-wrap').length < 1) {
								// 使用参数 false 表示只总结主贴
								this.getPostContent(false);
							}
						}
					}
				}, 1000);
			}

			// 回帖总结功能
			if (this.localChecked.summaryAll) {
				this.allPostsSummaryIntervalId = setInterval(() => {
					if ($('.aicreated-all-btn').length < 1) {
						const buttonHtml = `<button class="aicreated-all-btn" type="button" style="display:inline-flex!important;">AI 总结全部回帖</button>`;
						this.tryInsertButton(buttonHtml, 'aicreated-all-btn');
						$('.aicreated-all-btn').click(() => {
							$('.gpt-summary-wrap').remove();
							// 使用参数 true 表示总结所有帖子
							this.getPostContent(true);
						});
					}
				}, 1000);
			}

			// 标题生成功能
			if (this.localChecked.title) {
				this.titleGenerationIntervalId = setInterval(() => {
					if ($('.action-title').length > 0) {
						if ($('.action-title').html().includes('创建新话题')) {
							if ($('.aicreatenewtopictitle').length < 1) {
								$('.action-title').append('<span class="aicreatenewtopictitle">AI 生成标题</span>');

								$('.aicreatenewtopictitle').click(() => {
									$('#reply-title').val('正在生成中，请稍后...');
									this.getCreateNewTopicTitle();
								});
							}
						}
					}
				}, 1000);

				// 清理过期的 AI 总结缓存记录
				dbStorage.cleanExpiredSummaryCache().catch((error) => {
					console.error('清理缓存失败：', error);
				});
			}
		},

		// 获取帖子内容并生成总结（通过 background script 绕过 CORS）
		async getPostContent(isSummaryAll = null) {
			$('.post-stream').before(
				`<div class="gpt-summary-wrap">
          <div class="gpt-summary">AI 总结：正在使用 AI 总结内容中，请稍后...</div>
         </div>`,
			);

			const settingsData = getSafeSettings();
			const config = settingsData ? settingsData.gptdata : this.localChecked;
			const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

			return new Promise((resolve, reject) => {
				let str = $('#topic-title h1 a').text();

				// 如果传入了参数，则使用参数值；否则使用配置值
				const summaryAll = isSummaryAll !== null ? isSummaryAll : this.localChecked.summaryAll;

				if (summaryAll) {
					// 收集所有帖子的内容
					$('.topic-post').each((index, element) => {
						str += `||${$(element).find('.first').text()} ：${$(element).find('.cooked').text()}`;
					});
					str = `${config.prompt3}\n帖子内容如下：\n${str}`;
				} else {
					// 只收集主贴内容
					str += $('#post_1 .cooked').text();
					str = `${config.prompt}\n帖子内容如下：\n${str}`;
				}

				// 构建请求头
				const headers = {
					'Content-Type': 'application/json',
				};

				// 根据不同服务商设置认证头
				let apiUrl = config.api_url;
				switch (config.provider) {
					case 'openai':
					case 'deepseek':
						headers.Authorization = `Bearer ${config.apikey}`;
						break;
				}

				// 构建请求体
				let requestBody;
				const customParams = this.getCustomParams(config);
				switch (config.provider) {
					case 'openai':
					case 'deepseek':
						requestBody = {
							model: config.model,
							messages: [{ role: 'user', content: str }],
							stream: true,
							...(config.isTemPer ? { temperature: Number(config.temperature) } : {}),
							...customParams,
						};
						break;
				}

				let fullContent = '';

				// 流式数据消息监听器
				const streamListener = async (message) => {
					if (message.action === 'ai_stream_chunk') {
						const chunk = message.chunk;
						const lines = chunk.split('\n');

						lines.forEach((line) => {
							if (line.startsWith('data: ') && line !== 'data: [DONE]') {
								try {
									const jsonData = JSON.parse(line.slice(6));
									if (jsonData.choices?.[0]?.delta?.content) {
										const content = jsonData.choices[0].delta.content;
										fullContent += content;
										$('.gpt-summary').html(marked.parse(fullContent));
									}
								} catch (error) {
									// 忽略解析错误
								}
							}
						});
					} else if (message.action === 'ai_stream_done') {
						// 流结束，保存到 IndexedDB
						browserAPI.runtime.onMessage.removeListener(streamListener);
						const regex = /^(https:\/\/linux\.do\/t\/topic\/\d+)(\/\d+)?$/;
						const match = window.location.href.match(regex)?.[1];
						if (match && fullContent) {
							await this.addOrUpdateSummaryCache(match, fullContent);
						}
						resolve();
					} else if (message.action === 'ai_stream_error') {
						browserAPI.runtime.onMessage.removeListener(streamListener);
						$('.gpt-summary').html(`生成失败：${message.error}`);
						reject(new Error(message.error));
					}
				};

				// 添加消息监听器
				browserAPI.runtime.onMessage.addListener(streamListener);

				// 通过 background script 发送流式请求
				browserAPI.runtime.sendMessage(
					{
						action: 'ai_api_stream_proxy',
						url: apiUrl,
						method: 'POST',
						headers,
						body: requestBody,
					},
					(response) => {
						if (browserAPI.runtime.lastError) {
							browserAPI.runtime.onMessage.removeListener(streamListener);
							$('.gpt-summary').html(`生成失败：${browserAPI.runtime.lastError.message}`);
							reject(new Error(browserAPI.runtime.lastError.message));
							return;
						}

						if (!response?.started) {
							browserAPI.runtime.onMessage.removeListener(streamListener);
							$('.gpt-summary').html(`生成失败：无法启动流式请求`);
							reject(new Error('无法启动流式请求'));
						}
					},
				);
			});
		},

		// 生成 AI 回复（通过 background script 绕过 CORS）
		async setAIRelpy() {
			$('.aireply-popup').show();
			$('.aireply-popup-text').html('AI 推荐回复正在生成中，请稍后。。。');
			const settingsData = getSafeSettings();
			const config = settingsData ? settingsData.gptdata : this.localChecked;
			const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

			return new Promise((resolve, reject) => {
				const str = $('#topic-title h1 a').text() + $('#post_1 .cooked').text();
				const prompt = `${config.prompt1}
帖子内容如下：
${str}`;

				// 构建请求头
				const headers = {
					'Content-Type': 'application/json',
				};

				let apiUrl = config.api_url;
				switch (config.provider) {
					case 'openai':
					case 'deepseek':
						headers.Authorization = `Bearer ${config.apikey}`;
						break;
				}

				// 构建请求体
				let requestBody;
				const customParams = this.getCustomParams(config);
				switch (config.provider) {
					case 'openai':
					case 'deepseek':
						requestBody = {
							model: config.model,
							messages: [{ role: 'user', content: prompt }],
							...(config.isTemPer ? { temperature: Number(config.temperature) } : {}),
							...customParams,
						};
						break;
				}

				// 通过 background script 发送请求，绕过 CORS 限制
				browserAPI.runtime.sendMessage(
					{
						action: 'ai_api_proxy',
						url: apiUrl,
						method: 'POST',
						headers,
						body: requestBody,
					},
					(response) => {
						if (browserAPI.runtime.lastError) {
							$('.aireply-popup-text').html(`生成失败：${browserAPI.runtime.lastError.message}`);
							reject(new Error(browserAPI.runtime.lastError.message));
							return;
						}

						if (response.success) {
							let content = '';
							content = response.data?.choices?.[0]?.message?.content || '无法获取回复内容';
							this.AIReplyPopup(content);
							resolve();
						} else {
							const errorMsg = response.data?.error?.message || response.error || '未知错误';
							$('.aireply-popup-text').html(`生成失败：${errorMsg}`);
							reject(new Error(errorMsg));
						}
					},
				);
			});
		},

		// 测试 API 连通性（通过 background script 绕过 CORS）
		async testConnection() {
			this.connectionStatus = {
				type: 'info',
				message: '正在测试连接...',
			};

			const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

			try {
				const headers = {
					'Content-Type': 'application/json',
				};

				// 根据不同服务商设置不同的认证头
				let apiUrl = this.localChecked.api_url;
				switch (this.localChecked.provider) {
					case 'openai':
					case 'deepseek':
						headers.Authorization = `Bearer ${this.localChecked.apikey}`;
						break;
				}

				// 构建请求体
				let requestBody;
				const customParams = this.getCustomParams(this.localChecked);
				switch (this.localChecked.provider) {
					case 'openai':
					case 'deepseek':
						requestBody = {
							model: this.localChecked.model,
							messages: [{ role: 'user', content: '你好！' }],
							...customParams,
						};
						break;
				}
        
				// 通过 background script 发送请求，绕过 CORS 限制
				const response = await new Promise((resolve, reject) => {
					browserAPI.runtime.sendMessage(
						{
							action: 'ai_api_proxy',
							url: apiUrl,
							method: 'POST',
							headers,
							body: requestBody,
						},
						(result) => {
							if (browserAPI.runtime.lastError) {
								reject(new Error(browserAPI.runtime.lastError.message));
								return;
							}
							resolve(result);
						},
					);
				});

				if (response.success) {
					this.connectionStatus = {
						type: 'success',
						message: '连接成功！API 配置正确。',
					};
				} else {
					const errorMsg = response.data?.error?.message || response.error || '未知错误';
					this.connectionStatus = {
						type: 'error',
						message: `连接失败：${errorMsg}`,
					};
				}
			} catch (error) {
				this.connectionStatus = {
					type: 'error',
					message: `连接失败：${error.message || '网络错误'}`,
				};
			}
		},

		// 推荐回复弹窗
		AIReplyPopup(text) {
			$('.aireply-popup-text').html(text);
		},
		// AI 根据新建话题内容生成标题（通过 background script 绕过 CORS）
		async getCreateNewTopicTitle() {
			const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

			return new Promise((resolve, reject) => {
				let topic_contentdata = '';
				if ($('.ProseMirror-container').length > 0) {
					topic_contentdata = $('.ProseMirror-container').html();
				} else {
					topic_contentdata = $('.d-editor-preview').html();
				}
				const settingsData = getSafeSettings();
				const config = settingsData ? settingsData.gptdata : this.localChecked;
				const prompt = `${config.prompt2}
帖子内容如下：
${topic_contentdata}`;

				// 构建请求头
				const headers = {
					'Content-Type': 'application/json',
				};

				let apiUrl = config.api_url;
				switch (config.provider) {
					case 'openai':
					case 'deepseek':
						headers.Authorization = `Bearer ${config.apikey}`;
						break;
				}

				// 构建请求体
				let requestBody;
				const customParams = this.getCustomParams(config);
				switch (config.provider) {
					case 'openai':
					case 'deepseek':
						requestBody = {
							model: config.model,
							messages: [{ role: 'user', content: prompt }],
							...(config.isTemPer ? { temperature: Number(config.temperature) } : {}),
							...customParams,
						};
						break;
				}

				// 通过 background script 发送请求，绕过 CORS 限制
				browserAPI.runtime.sendMessage(
					{
						action: 'ai_api_proxy',
						url: apiUrl,
						method: 'POST',
						headers,
						body: requestBody,
					},
					(response) => {
						if (browserAPI.runtime.lastError) {
							$('#reply-title').val(`抱歉生成失败，请检查配置或者反馈给开发者！`);
							reject(new Error(browserAPI.runtime.lastError.message));
							return;
						}

						if (response.success) {
							let title = '';
							title = response.data?.choices?.[0]?.message?.content || '无法获取标题';
							$('#reply-title').val(title);
							resolve();
						} else {
							const errorMsg = response.data?.error?.message || response.error || '未知错误';
							$('#reply-title').val(`抱歉生成失败：${errorMsg}`);
							reject(new Error(errorMsg));
						}
					},
				);
			});
		},
		async refreshAISummary() {
			setTimeout(async () => {
				$('.gpt-summary-wrap').remove();

				// 如果开启了主贴总结功能，重新获取缓存
				if (this.localChecked.value1 && $('.post-stream').length > 0) {
					const regex = /^(https:\/\/linux\.do\/t\/topic\/\d+)(\/\d+)?$/;

					if (window.location.href.match(regex)) {
						const match = window.location.href.match(regex)[1];

						// 使用新的缓存管理方法
						const cachedContent = await this.getSummaryCacheByUrl(match);

						if (cachedContent) {
							$('.post-stream').before(
								`<div class="gpt-summary-wrap">
<div class="gpt-summary">${marked.parse(cachedContent)}</div>
</div>`,
							);
						} else if (!this.localChecked.btn) {
							// 如果没有缓存且设置为自动总结，则生成新的总结
							this.getPostContent(false);
						}
					}
				}
			}, 500);
		},
	},
	async created() {
		// 先调用 setCreatedBtn 确保样式正确应用
		this.setCreatedBtn();

		// 迁移 localStorage 中的缓存数据到 IndexedDB
		try {
			await dbStorage.migrateSummaryCacheFromLocalStorage();
		} catch (error) {
			console.error('❌ 迁移缓存数据失败：', error);
		}

		// 添加强制显示按钮的样式
		$('head').append(`
      <style>
        .aicreated-btn[style*="display:inline-flex"] { 
          display: inline-flex !important; 
          visibility: visible !important; 
        }
        .aireplay-btn[style*="display:inline-flex"] { 
          display: inline-flex !important; 
          visibility: visible !important; 
        }
        .aicreated-all-btn[style*="display:inline-flex"] { 
          display: inline-flex !important; 
          visibility: visible !important; 
        }
      </style>
    `);

		await this.waitForDataLoad();

		// 使用加载完成的数据初始化按钮逻辑
		this.initializeButtonLogic();

		this.boundRefreshAISummary = this.refreshAISummary.bind(this);

		// 监听浏览器前进/后退事件
		window.addEventListener('popstate', this.boundRefreshAISummary);

		const originalPushState = history.pushState;
		history.pushState = function () {
			const result = originalPushState.apply(this, arguments);
			window.dispatchEvent(new Event('pushstate'));
			return result;
		};

		const originalReplaceState = history.replaceState;
		history.replaceState = function () {
			const result = originalReplaceState.apply(this, arguments);
			window.dispatchEvent(new Event('replacestate'));
			return result;
		};

		// 监听 pushstate 和 replacestate 事件
		window.addEventListener('pushstate', this.boundRefreshAISummary);

		window.addEventListener('replacestate', this.boundRefreshAISummary);

		// 初始页面
		if (window.location.href.includes('/topic/')) {
			this.refreshAISummary();
		}

		this.handleLinkClick = () => {
			$('.gpt-summary-wrap').remove();
		};
		$(document).on('click', '.topic-list .main-link a.title, a[href*="/t/topic/"]', this.handleLinkClick);

		let lastUrl = window.location.href;
		this.observer = new MutationObserver(() => {
			if (lastUrl !== window.location.href) {
				lastUrl = window.location.href;
				setTimeout(() => {
					if (window.location.href.includes('/topic/')) {
						this.refreshAISummary();
					} else {
						$('.gpt-summary-wrap').remove();
					}
				}, 500);
			}
		});

		// 配置观察器
		this.observer.observe(document, {
			subtree: true,
			childList: true,
		});
	},
	beforeUnmount() {
		// 清理 MutationObserver
		if (this.observer) {
			this.observer.disconnect();
		}

		// 移除事件监听器
		window.removeEventListener('popstate', this.boundRefreshAISummary);
		window.removeEventListener('pushstate', this.boundRefreshAISummary);
		window.removeEventListener('replacestate', this.boundRefreshAISummary);

		// 移除点击事件监听
		$(document).off('click', '.topic-list .main-link a.title, a[href*="/t/topic/"]', this.handleLinkClick);

		// 清除所有定时器
		this.clearAllTimers();
	},
	// Vue 2 兼容性
	beforeDestroy() {
		// 清除所有定时器
		this.clearAllTimers();
	},
};
</script>

<style lang="less" scoped>
.item {
	border: none !important;
	padding-bottom: 0 !important;

	select {
		height: 30px;
		border-radius: 4px;
		border: 1px solid #ddd;
		padding: 0 8px;
	}

	.info {
		flex: 1;
	}

	.label {
		width: 80px;
		text-align: right;
		white-space: nowrap;
		margin-right: 10px;
	}
}

.flex {
	display: flex;
	gap: 8px;

	input {
		flex: 1;
	}
}

.config-card {
	background: #f9f9f9;
	border-radius: 8px;
	padding: 15px;
	margin: 15px 0;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.config-title {
	font-weight: bold;
	font-size: 16px;
	margin-bottom: 15px;
	color: #333;
	border-bottom: 1px solid #eee;
	padding-bottom: 8px;
}

input[type='text'],
input[type='range'],
textarea,
select {
	border: 1px solid #ddd !important;
	border-radius: 4px !important;
	padding: 8px;
	width: 100%;
	height: 36px;
	margin-bottom: 8px;
	transition: border-color 0.3s;
	box-sizing: border-box;
}

input[type='text']:focus,
textarea:focus,
select:focus {
	border-color: #2684ff;
	outline: none;
	box-shadow: 0 0 0 2px rgba(38, 132, 255, 0.2);
}

.temperature {
	display: flex;
	align-items: center;
	justify-content: space-between;

	.tit {
		display: flex;
		align-items: center;
		flex: 1;
	}

	label {
		margin-right: 10px !important;
		min-width: 200px;
	}

	input[type='range'] {
		flex: 1;
		width: auto !important;
		margin: 0 10px;
	}
}

.connection-status {
	margin-top: 8px;
	padding: 8px;
	border-radius: 4px;

	&.success {
		background: #e6f4ea;
		color: #1e8e3e;
	}

	&.error {
		background: #fce8e6;
		color: #d93025;
	}

	&.info {
		background: #e8f0fe;
		color: #1a73e8;
	}
}

textarea {
	min-height: 80px;
	resize: vertical;
}

.prompt .item {
	flex-direction: column;
	align-items: flex-start !important;
}

// 进阶用法：自定义参数样式
.advanced-params {
	flex-direction: column;
	align-items: flex-start !important;
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px dashed #ddd;

	.label {
		width: auto;
		font-weight: bold;
		color: #666;
		margin-bottom: 8px;
	}

	.info {
		width: 100%;
	}

	.advanced-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;

		span {
			font-size: 14px;
			color: #666;
		}

		input[type='checkbox'] {
			margin: 0;
		}
	}

	.custom-params-input {
		width: 100%;
		min-height: 100px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 13px;
		line-height: 1.5;
		resize: vertical;

		&:disabled {
			background-color: #f5f5f5;
			color: #999;
			cursor: not-allowed;
		}
	}

	.custom-params-tip {
		font-size: 12px;
		color: #999;
		font-style: italic;
		margin-top: 4px;
	}
}
</style>
