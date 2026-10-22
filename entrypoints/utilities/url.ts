/**
 * 检查 URL 查询参数是否匹配指定值
 * @param {string} key - 查询参数名
 * @param {string} value - 要匹配的值
 * @param {string} url - 要检查的 URL
 * @returns {boolean}
 */
export function isQueryParamEqual(key: string, value: string, url?: string) {
    const params = new URLSearchParams(url ?? window.location.search);
    return params.get(key) === value;
}

/**
 * 是否为用户主页（/u/用户名/...）
 * @returns {boolean}
 */
export function isUserPage() {
    return /^\/u\//.test(window.location.pathname);
}
