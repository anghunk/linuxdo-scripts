export default defineBackground(() => {
	console.log('Hello background!', { id: browser.runtime.id });
});
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// 根据用户偏好切换点击扩展图标时的打开行为（sidepanel 或 popup）
const CLICK_BEHAVIOR_KEY = 'clickOpenTarget'; // 'sidepanel' | 'popup'

async function applyClickBehavior(target: string) {
	const isSidePanel = target === 'sidepanel';
	try {
		if (browserAPI.sidePanel && browserAPI.sidePanel.setPanelBehavior) {
			await browserAPI.sidePanel.setPanelBehavior({ openPanelOnActionClick: isSidePanel });
		}
	} catch (err) {
		console.warn('sidePanel.setPanelBehavior not available', err);
	}

	try {
		// 当选择 sidepanel 时，清空 action 的 popup；选择 popup 时，设置为 popup.html
		if (browserAPI.action && browserAPI.action.setPopup) {
			await browserAPI.action.setPopup({ popup: isSidePanel ? '' : 'popup.html' });
		}
	} catch (err) {
		console.warn('action.setPopup not available', err);
	}
}

// 初始化：读取存储并应用行为；默认 sidepanel
browserAPI.storage?.local.get([CLICK_BEHAVIOR_KEY], (res) => {
	const target = res?.[CLICK_BEHAVIOR_KEY] || 'sidepanel';
	applyClickBehavior(target);
});

// 监听存储变化，动态应用
browserAPI.storage?.onChanged?.addListener((changes, area) => {
	if (area !== 'local') return;
	if (CLICK_BEHAVIOR_KEY in changes) {
		const newValue = changes[CLICK_BEHAVIOR_KEY]?.newValue || 'sidepanel';
		applyClickBehavior(newValue);
	}
});

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'sendData') {
		// 查询所有打开的标签页
		browserAPI.tabs.query({ url: '*://linux.do/*' }, (tabs) => {
			tabs.forEach((tab) => {
				if (tab.id) {
					browserAPI.tabs.sendMessage(tab.id, {
						action: 'setData',
						data: request.data,
					});
				}
			});
		});
	}
});

// 进入 bookmark 收藏夹
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'open_bookmark_page') {
		const bookmarkPageURL = browserAPI.runtime.getURL('/bookmark.html');
		browserAPI.tabs.create({ url: bookmarkPageURL });
	}
});

// 进入 share 分享页面
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'open_share_page') {
		const extensionURL = browserAPI.runtime.getURL('/share.html');
		browserAPI.tabs.create({ url: extensionURL });
	}
});

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === 'webdav') {
		const { method, url, headers, data } = request;

		fetch(url, {
			method: method,
			headers: headers,
			body: data || undefined,
		})
			.then(async (response) => {
				const text = await response.text();
				sendResponse({
					status: response.status,
					statusText: response.statusText,
					data: text,
				});
			})
			.catch((error) => {
				sendResponse({
					error: error.message,
				});
			});

		return true; // 保持消息通道打开
	}
});

// AI API 代理请求监听器（绕过 CORS 限制）
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'ai_api_proxy') {
		const { url, method = 'POST', headers = {}, body } = request;

		// 调试日志：请求信息
		console.log('[AI API Proxy] 请求开始:', {
			url,
			method,
			headers,
			body,
		});

		fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		})
			.then(async (response) => {
				const contentType = response.headers.get('content-type');
				let data;

				// 调试日志：响应状态
				console.log('[AI API Proxy] 响应状态:', {
					status: response.status,
					statusText: response.statusText,
					contentType,
					ok: response.ok,
				});

				if (contentType && contentType.includes('application/json')) {
					data = await response.json();
				} else {
					data = await response.text();
				}

				// 调试日志：响应数据
				console.log('[AI API Proxy] 响应数据:', data);

				sendResponse({
					success: response.ok,
					status: response.status,
					statusText: response.statusText,
					data,
				});
			})
			.catch((error) => {
				// 调试日志：请求错误
				console.error('[AI API Proxy] 请求错误:', error);
				sendResponse({
					success: false,
					error: error.message,
				});
			});

		return true; // 保持消息通道打开
	}
});

// AI API 流式请求代理（用于流式响应）
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'ai_api_stream_proxy') {
		const { url, method = 'POST', headers = {}, body, tabId } = request;

		// 获取发送者的 tab ID
		const targetTabId = tabId || sender.tab?.id;

		fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		})
			.then(async (response) => {
				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ message: response.statusText }));
					if (targetTabId) {
						browserAPI.tabs.sendMessage(targetTabId, {
							action: 'ai_stream_error',
							error: errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`,
						});
					}
					return;
				}

				const reader = response.body?.getReader();
				if (!reader) {
					if (targetTabId) {
						browserAPI.tabs.sendMessage(targetTabId, {
							action: 'ai_stream_error',
							error: '无法获取响应流',
						});
					}
					return;
				}

				const decoder = new TextDecoder();

				const processStream = async (): Promise<void> => {
					const { done, value } = await reader.read();

					if (done) {
						if (targetTabId) {
							browserAPI.tabs.sendMessage(targetTabId, {
								action: 'ai_stream_done',
							});
						}
						return;
					}

					const chunk = decoder.decode(value, { stream: true });
					if (targetTabId) {
						browserAPI.tabs.sendMessage(targetTabId, {
							action: 'ai_stream_chunk',
							chunk,
						});
					}

					return processStream();
				};

				processStream();
			})
			.catch((error) => {
				if (targetTabId) {
					browserAPI.tabs.sendMessage(targetTabId, {
						action: 'ai_stream_error',
						error: error.message || '网络错误',
					});
				}
			});

		sendResponse({ started: true });
		return true;
	}
});

// 获取 connect.linux.do 接口数据的事件监听器
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'fetch_connect_data') {
		const { endpoint = '', options = {}, hostname } = request;

		// 优先使用传递的 hostname，否则从调用页面的 URL 获取
		let connectDomain = 'connect.linux.do'; // 默认值

		if (hostname) {
			// 如果前端传递了 hostname 参数，直接使用
			connectDomain = `connect.${hostname}`;
		} else if (sender.tab?.url) {
			try {
				const tabUrl = new URL(sender.tab.url);
				// 根据 hostname 动态设置 connect 前缀
				if (tabUrl.hostname === 'linux.do') {
					connectDomain = 'connect.linux.do';
				} else if (tabUrl.hostname.endsWith('.linux.do')) {
					// 如果是子域名，可能需要对应的 connect 子域名
					connectDomain = `connect.${tabUrl.hostname}`;
				} else {
					// 其他情况可以根据需要定制
					connectDomain = `connect.${tabUrl.hostname}`;
				}
			} catch (error) {
				console.warn('无法解析调用页面的 URL:', error);
			}
		}

		const connectUrl = `https://${connectDomain}${endpoint}`;

		// 默认请求配置
		const defaultOptions = {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			},
		};

		// 合并用户提供的选项
		const fetchOptions = {
			...defaultOptions,
			...options,
			headers: {
				...defaultOptions.headers,
				...(options.headers || {}),
			},
		};

		// 在 background script 中发起请求，绕过 CORS 限制
		fetch(connectUrl, fetchOptions)
			.then(async (response) => {
				let responseData;
				const contentType = response.headers.get('content-type');

				if (contentType && contentType.includes('application/json')) {
					responseData = await response.json();
				} else {
					responseData = await response.text();
				}

				sendResponse({
					success: true,
					status: response.status,
					statusText: response.statusText,
					data: responseData,
					headers: Object.fromEntries(response.headers.entries()),
					url: connectUrl,
				});
			})
			.catch((error) => {
				console.error('Connect API 请求失败：', error);
				sendResponse({
					success: false,
					error: error.message,
					url: connectUrl,
				});
			});

		return true; // 保持消息通道打开
	}
});
