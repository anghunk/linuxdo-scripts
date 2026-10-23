// 全局設置管理器
// 持久化修复：初始化和局部修改使用事务内的最新记录，读取异常向上传递。
import dbStorage from './indexedDBStorage.js';
import StorageDebugger from './storageDebugger.js';

class SettingsManager {
	constructor(storage = dbStorage) {
		this.storage = storage;
		this.cache = null;
		this.isLoading = false;
		this.loadPromise = null;
	}

	// 合并同一次加载中的请求，后续调用重新读取以获取其他页面的修改。
	async getSettings() {
		if (this.isLoading) {
			return this.loadPromise;
		}

		this.isLoading = true;
		this.loadPromise = this._loadSettings();

		try {
			this.cache = await this.loadPromise;
			return this.cache;
		} finally {
			this.isLoading = false;
			this.loadPromise = null;
		}
	}

	// 私有方法：加載設置
	async _loadSettings() {
		return await this.storage.getSettingsWithMigration();
	}

	async initializeSettings(defaults) {
		// 读取或迁移失败时立即停止，不能把异常当成首次安装。
		await this.storage.getSettingsWithMigration();
		const settings = await this.storage.modifySettings((current) => this.deepMerge(defaults, current || {}));
		this.cache = settings;
		return settings;
	}

	// 保存設置數據
	async saveSettings(settingsData) {
		try {
			// 在開發環境中進行調試檢查
			if (process.env.NODE_ENV === 'development') {
				const debugResult = StorageDebugger.canBeStored(settingsData);
				if (!debugResult.canStore) {
					console.warn('設置數據包含不可存儲的屬性：', debugResult.issues);
				}
			}

			await this.storage.saveSettings(settingsData);
			this.cache = settingsData; // 更新緩存
			return true;
		} catch (error) {
			console.error('保存設置失敗：', error);

			// 如果是 DataCloneError，嘗試生成調試報告
			if (error?.name === 'DataCloneError') {
				console.group('🔍 DataCloneError 調試信息');
				StorageDebugger.generateReport(settingsData, 'settingsData');

				// 嘗試自動修復
				const fixResult = StorageDebugger.attemptFix(settingsData);
				if (fixResult.success) {
					console.log('🔧 嘗試使用修復後的數據重新保存...');
					try {
						await this.storage.saveSettings(fixResult.data);
						this.cache = fixResult.data;
						console.log('✅ 使用修復後的數據保存成功');
						console.groupEnd();
						return true;
					} catch (retryError) {
						console.error('❌ 修復後仍然失敗：', retryError);
					}
				}
				console.groupEnd();
			}

			return false;
		}
	}

	// 更新部分設置
	async updateSettings(partialSettings) {
		try {
			// 在事务中合并最新记录，不能从本页面的缓存生成整份快照。
			const settings = await this.storage.modifySettings((current) => this.deepMerge(current || {}, partialSettings));
			this.cache = settings;
			return true;
		} catch (error) {
			console.error('更新設置失敗：', error);
			return false;
		}
	}

	// 獲取特定設置項
	async getSetting(key, defaultValue = null) {
		try {
			const settings = await this.getSettings();
			return settings && settings[key] !== undefined ? settings[key] : defaultValue;
		} catch (error) {
			console.error('獲取設置項失敗：', error);
			return defaultValue;
		}
	}

	// 設置特定設置項
	async setSetting(key, value) {
		try {
			return await this.updateSettings({ [key]: value });
		} catch (error) {
			console.error('設置設置項失敗：', error);
			return false;
		}
	}

	// 基於數據庫中的最新值修改單個設置項（讀改寫在同一事務內完成）
	// updater 接收當前值並返回新值
	async modifySetting(key, updater) {
		try {
			const settings = await this.storage.modifySettings((current) => ({
				...(current || {}),
				[key]: updater(current ? current[key] : undefined),
			}));
			this.cache = settings;
			return { success: true, value: settings[key] };
		} catch (error) {
			console.error('修改設置項失敗：', error);
			return { success: false };
		}
	}

	// 清除緩存
	clearCache() {
		this.cache = null;
	}

	// 刪除所有設置
	async clearSettings() {
		try {
			await this.storage.removeSettings();
			this.cache = null;
			return true;
		} catch (error) {
			console.error('清除設置失敗：', error);
			return false;
		}
	}

	// 深度合併對象
	deepMerge(target, source) {
		const result = { ...target };

		for (const key in source) {
			if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
				result[key] !== null && typeof result[key] === 'object' && !Array.isArray(result[key])) {
				result[key] = this.deepMerge(result[key], source[key]);
			} else {
				result[key] = source[key];
			}
		}

		return result;
	}

	// 兼容性方法：模擬 localStorage 接口
	async getItem(key) {
		if (key === 'linuxdoscriptssettingDMI') {
			const settings = await this.getSettings();
			return settings ? JSON.stringify(settings) : null;
		}
		// 對於其他 key，回退到 localStorage
		return localStorage.getItem(key);
	}

	async setItem(key, value) {
		if (key === 'linuxdoscriptssettingDMI') {
			try {
				const settings = JSON.parse(value);
				return await this.saveSettings(settings);
			} catch (error) {
				console.error('設置數據格式錯誤：', error);
				return false;
			}
		}
		// 對於其他 key，回退到 localStorage
		localStorage.setItem(key, value);
		return true;
	}

	async removeItem(key) {
		if (key === 'linuxdoscriptssettingDMI') {
			return await this.clearSettings();
		}
		// 對於其他 key，回退到 localStorage
		localStorage.removeItem(key);
		return true;
	}
}

// 創建全局實例
const settingsManager = new SettingsManager();

// 為了向後兼容，提供一個 localStorage 風格的 API
const compatStorage = {
	async getItem(key) {
		return await settingsManager.getItem(key);
	},

	async setItem(key, value) {
		return await settingsManager.setItem(key, value);
	},

	async removeItem(key) {
		return await settingsManager.removeItem(key);
	},
};

export default settingsManager;
export { SettingsManager, compatStorage };
