const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const DEFAULT_SITE_HOSTNAME = 'linux.do';

function isLinuxDoHostname(hostname) {
	return hostname === DEFAULT_SITE_HOSTNAME || hostname.endsWith(`.${DEFAULT_SITE_HOSTNAME}`);
}

export function normalizeOriginPattern(input) {
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

export function isDefaultSiteUrl(input) {
	try {
		const url = new URL(input);
		return url.protocol === 'https:' && isLinuxDoHostname(url.hostname);
	} catch {
		return false;
	}
}

export async function requestSitePermission(input) {
	if (isDefaultSiteUrl(input)) {
		return {
			success: true,
			granted: true,
			origin: null,
			source: 'default',
		};
	}

	const origin = normalizeOriginPattern(input);

	// Chrome MV3 要求 permissions.request() 必须运行在原始用户手势中，
	// 因此这里给扩展页按钮点击等前台流程直接调用，不能再转发到 background。
	const granted = await browserAPI.permissions.request({ origins: [origin] });
	const hasPermission = granted || (await browserAPI.permissions.contains({ origins: [origin] }));

	return {
		success: hasPermission,
		granted: hasPermission,
		origin,
		source: 'optional',
		error: hasPermission ? null : `未获得 ${origin} 的访问权限`,
	};
}
