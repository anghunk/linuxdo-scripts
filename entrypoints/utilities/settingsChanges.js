const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// 只提交相对面板加载时的改动，避免旧页面把未编辑的字段写回数据库。
export function getSettingsChanges(baseline, edited) {
	const changes = {};
	for (const key of Object.keys(edited)) {
		const previous = baseline?.[key];
		const value = edited[key];
		if (isRecord(previous) && isRecord(value)) {
			const nested = getSettingsChanges(previous, value);
			if (Object.keys(nested).length) changes[key] = nested;
		} else if (JSON.stringify(previous) !== JSON.stringify(value)) {
			changes[key] = value;
		}
	}
	return changes;
}
