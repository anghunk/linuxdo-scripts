export default defineBackground(() => {
	console.log('Hello background!', { id: browser.runtime.id });
});

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const DEFAULT_SITE_PATTERNS = ['https://linux.do/*', 'https://*.linux.do/*'];
const LINUX_DO_TAB_PATTERNS = ['*://linux.do/*', '*://*.linux.do/*'];

type SiteAccessCheckResult =
	| {
			success: true;
			allowed: true;
			origin: null;
			source: 'default';
	  }
	| {
			success: true;
			allowed: true;
			origin: string;
			source: 'optional';
	  }
	| {
			success: true;
			allowed: false;
			origin: string;
			source: 'missing';
	  };

type SiteAccessResult =
	| SiteAccessCheckResult
	| {
			success: false;
			allowed: false;
			origin: string;
			source: 'missing';
			error: string;
			needs_permission: true;
	  };

function isLinuxDoHostname(hostname: string) {
	return hostname === 'linux.do' || hostname.endsWith('.linux.do');
}

function normalizeOriginPattern(input: string) {
	const rawInput = (input || '').trim();
	if (!rawInput) {
		throw new Error('URL 不能为空');
	}

	const normalizedInput = rawInput.endsWith('/*') ? rawInput.slice(0, -2) : rawInput;
	if (!normalizedInput.startsWith('http://') && !normalizedInput.startsWith('https://')) {
		throw new Error('URL 必须以 http:// 或 https:// 开头');
	}

	const url = new URL(normalizedInput);
	return `${url.origin}/*`;
}

function isDefaultSiteUrl(input: string) {
	try {
		const url = new URL(input);
		return url.protocol === 'https:' && isLinuxDoHostname(url.hostname);
	} catch {
		return false;
	}
}

async function getOptionalOrigins() {
	const permissions = await browserAPI.permissions.getAll();
	const origins = permissions.origins || [];
	return origins
		.filter((origin) => !DEFAULT_SITE_PATTERNS.includes(origin))
		.sort((left, right) => left.localeCompare(right));
}

async function checkSiteAccess(input: string): Promise<SiteAccessCheckResult> {
	if (isDefaultSiteUrl(input)) {
		return {
			success: true,
			allowed: true,
			origin: null,
			source: 'default',
		};
	}

	const origin = normalizeOriginPattern(input);
	const allowed = await browserAPI.permissions.contains({ origins: [origin] });
	if (allowed) {
		return {
			success: true,
			allowed: true,
			origin,
			source: 'optional',
		};
	}

	return {
		success: true,
		allowed: false,
		origin,
		source: 'missing',
	};
}

async function ensureSiteAccess(input: string): Promise<SiteAccessResult> {
	const result = await checkSiteAccess(input);
	if (result.allowed) {
		return result;
	}

	return {
		...result,
		success: false,
		error: `请先在「有权访问的网站」中授权 ${result.origin}`,
		needs_permission: true,
	};
}

function sendMissingPermission(
	sendResponse: (response?: any) => void,
	result: Extract<SiteAccessResult, { success: false }>,
) {
	sendResponse({
		success: false,
		error: result.error,
		needs_permission: true,
		origin: result.origin,
	});
}

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
	if (request.action === 'permissions_get_sites') {
		(async () => {
			try {
				sendResponse({
					success: true,
					defaultSites: DEFAULT_SITE_PATTERNS,
					optionalSites: await getOptionalOrigins(),
				});
			} catch (error) {
				sendResponse({
					success: false,
					error: error instanceof Error ? error.message : '获取授权站点失败',
				});
			}
		})();
		return true;
	}

	if (request.action === 'permissions_check_site') {
		(async () => {
			try {
				sendResponse(await checkSiteAccess(request.url || request.origin || ''));
			} catch (error) {
				sendResponse({
					success: false,
					allowed: false,
					error: error instanceof Error ? error.message : '站点权限检查失败',
				});
			}
		})();
		return true;
	}

	if (request.action === 'permissions_remove_site') {
		(async () => {
			try {
				const origin = normalizeOriginPattern(request.origin || request.url || '');
				if (DEFAULT_SITE_PATTERNS.includes(origin)) {
					sendResponse({ success: false, error: '默认站点权限不可移除' });
					return;
				}

				const removed = await browserAPI.permissions.remove({ origins: [origin] });
				sendResponse({ success: removed, removed, origin, error: removed ? null : `移除 ${origin} 权限失败` });
			} catch (error) {
				sendResponse({
					success: false,
					removed: false,
					error: error instanceof Error ? error.message : '移除站点权限失败',
				});
			}
		})();
		return true;
	}
});

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'sendData') {
		// 查询所有打开的标签页
		browserAPI.tabs.query({ url: LINUX_DO_TAB_PATTERNS }, (tabs) => {
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
		(async () => {
			// 这里仅检查权限并消费已授权结果，真正的申请动作必须在前台点击流程里完成
			const access = await ensureSiteAccess(request.url || '');
			if (!access.success) {
				sendResponse({
					error: access.error,
					needs_permission: true,
					origin: access.origin,
				});
				return;
			}

			const { method, url, headers, data } = request;
			fetch(url, {
				method,
				headers,
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
		})();

		return true;
	}
});

// AI API 代理请求监听器（绕过 CORS 限制）
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'ai_api_proxy') {
		(async () => {
			// 这里仅检查权限并消费已授权结果，真正的申请动作必须在前台点击流程里完成
			const access = await ensureSiteAccess(request.url || '');
			if (!access.success) {
				sendMissingPermission(sendResponse, access);
				return;
			}

			const { url, method = 'POST', headers = {}, body } = request;

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

					console.log('[AI API Proxy] 响应数据:', data);

					sendResponse({
						success: response.ok,
						status: response.status,
						statusText: response.statusText,
						data,
					});
				})
				.catch((error) => {
					console.error('[AI API Proxy] 请求错误:', error);
					sendResponse({
						success: false,
						error: error.message,
					});
				});
		})();

		return true;
	}
});

// AI API 流式请求代理（用于流式响应）
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'ai_api_stream_proxy') {
		(async () => {
			// 这里仅检查权限并消费已授权结果，真正的申请动作必须在前台点击流程里完成
			const access = await ensureSiteAccess(request.url || '');
			if (!access.success) {
				sendResponse({
					started: false,
					error: access.error,
					needs_permission: true,
					origin: access.origin,
				});
				return;
			}

			const { url, method = 'POST', headers = {}, body, tabId } = request;
			const targetTabId = tabId || sender.tab?.id;
			sendResponse({ started: true });

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
		})();

		return true;
	}
});

// 获取 connect.linux.do 接口数据的事件监听器
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'fetch_connect_data') {
		const { endpoint = '', options = {}, hostname } = request;

		// 优先使用传递的 hostname，否则从调用页面的 URL 获取
		let connectDomain = 'connect.linux.do';
		if (hostname && isLinuxDoHostname(hostname)) {
			connectDomain = hostname === 'linux.do' ? 'connect.linux.do' : `connect.${hostname}`;
		} else if (sender.tab?.url) {
			try {
				const tabUrl = new URL(sender.tab.url);
				if (tabUrl.protocol === 'https:' && isLinuxDoHostname(tabUrl.hostname)) {
					connectDomain = tabUrl.hostname === 'linux.do' ? 'connect.linux.do' : `connect.${tabUrl.hostname}`;
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

		return true;
	}
});
