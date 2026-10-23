// IndexedDB 存儲工具類
// 持久化修复：等待事务提交，读取失败不再回退为缺失记录，迁移时保留最新值。
class IndexedDBStorage {
	constructor(dbName = 'LinuxDoScriptsDB', version = 1) {
		this.dbName = dbName;
		this.version = version;
		this.storeName = 'settings';
		this.settingsKey = 'linuxdoscriptssettingDMI';
		this.summaryCacheKey = 'summaryCacheData';
		this.dbTimeout = 3000; // IndexedDB 操作超時時間（毫秒）
	}

	// 帶超時的 Promise 包裝器
	withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
		let timer;
		return Promise.race([
			promise,
			new Promise((_, reject) => {
				timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
			}),
		]).finally(() => clearTimeout(timer));
	}

	// 檢查 IndexedDB 是否可用
	isIndexedDBAvailable() {
		try {
			return typeof indexedDB !== 'undefined' && indexedDB !== null;
		} catch (e) {
			return false;
		}
	}

	// 1. 打開（或創建）數據庫
	openDB() {
		return new Promise((resolve, reject) => {
			// 檢查 IndexedDB 是否可用
			if (!this.isIndexedDBAvailable()) {
				reject(new Error('IndexedDB is not available'));
				return;
			}

			try {
				const req = indexedDB.open(this.dbName, this.version);
				let failed = false;
				req.onerror = () => {
					failed = true;
					reject(req.error);
				};
				req.onsuccess = () => {
					const db = req.result;
					if (failed) {
						db.close();
						return;
					}
					db.onversionchange = () => db.close();
					resolve(db);
				};
				req.onblocked = () => {
					failed = true;
					reject(new Error('IndexedDB is blocked'));
				};

				// 第一次運行會自動執行
				req.onupgradeneeded = () => {
					const db = req.result;
					if (!db.objectStoreNames.contains(this.storeName)) {
						db.createObjectStore(this.storeName, { keyPath: 'key' });
					}
				};
			} catch (error) {
				reject(error);
			}
		});
	}

	// 帶超時保護的 openDB
	async openDBWithTimeout() {
		const opening = this.openDB();
		try {
			return await this.withTimeout(opening, this.dbTimeout, 'IndexedDB open timeout');
		} catch (error) {
			// 超时后打开请求仍可能成功，关闭迟到的连接以免阻塞升级。
			opening.then((db) => db.close(), () => {});
			throw error;
		}
	}

	// 2. 存儲設置數據
	async saveSettings(settingsObj, customKey = null) {
		const keyToUse = customKey || this.settingsKey;
		await this.modifySettings(() => settingsObj, keyToUse);
		return keyToUse;
	}

	// 3. 讀取設置數據
	async getSettings(customKey = null) {
		const db = await this.openDBWithTimeout();
		const keyToUse = customKey || this.settingsKey;
		return new Promise((resolve, reject) => {
			try {
				const tx = db.transaction(this.storeName);
				const req = tx.objectStore(this.storeName).get(keyToUse);
				tx.oncomplete = () => resolve(req.result ? req.result.value : null);
				tx.onerror = (event) => reject(event.target?.error || tx.error || new Error('IndexedDB transaction failed'));
				tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
			} catch (error) {
				reject(error);
			}
		}).finally(() => db.close());
	}

	// 在同一個 readwrite 事務裡讀取、修改、寫回設置，多個標籤頁同時修改也不會互相覆蓋
	async modifySettings(modifier, customKey = null) {
		const db = await this.openDBWithTimeout();
		const keyToUse = customKey || this.settingsKey;
		return new Promise((resolve, reject) => {
			try {
				const tx = db.transaction(this.storeName, 'readwrite');
				const store = tx.objectStore(this.storeName);
				let updated;
				const getReq = store.get(keyToUse);
				getReq.onsuccess = () => {
					try {
						updated = this.sanitizeForStorage(modifier(getReq.result ? getReq.result.value : null));
						store.put({ key: keyToUse, value: updated, timestamp: Date.now() });
					} catch (error) {
						tx.abort();
						reject(error);
					}
				};
				tx.oncomplete = () => resolve(updated);
				tx.onerror = (event) => reject(event.target?.error || tx.error || new Error('IndexedDB transaction failed'));
				tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
			} catch (error) {
				reject(error);
			}
		}).finally(() => db.close());
	}

	// 4. 刪除設置數據
	async removeSettings() {
		const db = await this.openDBWithTimeout();
		return new Promise((resolve, reject) => {
			try {
				const tx = db.transaction(this.storeName, 'readwrite');
				tx.objectStore(this.storeName).delete(this.settingsKey);
				tx.oncomplete = () => resolve();
				tx.onerror = (event) => reject(event.target?.error || tx.error || new Error('IndexedDB transaction failed'));
				tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
			} catch (error) {
				reject(error);
			}
		}).finally(() => db.close());
	}

	// 5. 檢查是否存在設置數據
	async hasSettings() {
		try {
			const settings = await this.getSettings();
			return settings !== null;
		} catch (error) {
			console.error('檢查設置數據時出錯：', error);
			return false;
		}
	}

	// 6. 從 localStorage 遷移數據到 IndexedDB
	async migrateFromLocalStorage() {
		try {
			// 檢查舊的 localStorage 數據
			const oldKey = 'linxudoscriptssettingDMI'; // 錯誤寫法（舊版本兼容）
			const newKey = 'linuxdoscriptssettingDMI'; // 正確寫法

			let oldData = localStorage.getItem(oldKey);
			let newData = localStorage.getItem(newKey);

			let dataToMigrate = null;

			// 優先使用正確的 key，如果沒有則使用錯誤的 key
			if (newData) {
				dataToMigrate = JSON.parse(newData);
			} else if (oldData) {
				dataToMigrate = JSON.parse(oldData);
			}

			if (dataToMigrate) {
				// 清理數據並保存到 IndexedDB
				const cleanedData = this.sanitizeForStorage(dataToMigrate);
				// 其他页面可能已完成迁移或保存，不能用旧数据覆盖新记录。
				const settings = await this.modifySettings((current) => current ?? cleanedData);

				// 清理 localStorage 中的舊數據
				localStorage.removeItem(oldKey);
				localStorage.removeItem(newKey);

				console.log('數據已成功從 localStorage 遷移到 IndexedDB');
				return settings;
			}

			return null;
		} catch (error) {
			console.error('數據遷移失敗：', error);
			throw error;
		}
	}

	// 7. 獲取設置數據（包含遷移邏輯）
	async getSettingsWithMigration() {
		// 只有成功读取且记录不存在时才能迁移；读取失败必须交给调用方处理。
		const settings = await this.getSettings();
		return settings === null ? this.migrateFromLocalStorage() : settings;
	}

	// 回退到 localStorage（當 IndexedDB 不可用時）
	fallbackToLocalStorage() {
		try {
			const oldKey = 'linxudoscriptssettingDMI';
			const newKey = 'linuxdoscriptssettingDMI';
			
			let data = localStorage.getItem(newKey) || localStorage.getItem(oldKey);
			if (data) {
				return JSON.parse(data);
			}
			return null;
		} catch (error) {
			console.error('從 localStorage 回退獲取數據失敗：', error);
			return null;
		}
	}

	// 8. 清理數據以便存儲（移除不可序列化的屬性）
	sanitizeForStorage(obj) {
		if (obj === null || obj === undefined) {
			return obj;
		}

		// 處理基本類型
		if (typeof obj !== 'object') {
			return obj;
		}

		// 處理日期對象
		if (obj instanceof Date) {
			return obj.toISOString();
		}

		// 處理數組
		if (Array.isArray(obj)) {
			return obj.map((item) => this.sanitizeForStorage(item));
		}

		// 處理普通對象
		const cleaned = {};
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const value = obj[key];

				// 跳過函數
				if (typeof value === 'function') {
					continue;
				}

				// 跳過 DOM 元素
				if (value && typeof value === 'object' && value.nodeType) {
					continue;
				}

				// 跳過 Symbol
				if (typeof value === 'symbol') {
					continue;
				}

				// 跳過 undefined
				if (value === undefined) {
					continue;
				}

				// 檢測循環引用
				try {
					JSON.stringify(value);
					cleaned[key] = this.sanitizeForStorage(value);
				} catch (error) {
					// 如果 JSON.stringify 失敗，說明有循環引用或其他問題
					console.warn(`跳過不可序列化的屬性：${key}`, error);
					continue;
				}
			}
		}

		return cleaned;
	}

	// ===== AI 总结缓存数据管理方法 =====

	// 获取 AI 总结缓存数据
	async getSummaryCache() {
		try {
			const result = await this.getSettings(this.summaryCacheKey);
			return result || [];
		} catch (error) {
			console.error('获取 AI 总结缓存失败：', error);
			return [];
		}
	}

	// 保存 AI 总结缓存数据
	async saveSummaryCache(cacheArray) {
		try {
			// 限制缓存数量，只保留最近 20 个
			const limitedCache = Array.isArray(cacheArray) ? cacheArray.slice(-20) : [];
			return await this.saveSettings(limitedCache, this.summaryCacheKey);
		} catch (error) {
			console.error('保存 AI 总结缓存失败：', error);
			return false;
		}
	}

	// 添加或更新单个缓存项
	async addOrUpdateSummaryCache(topicUrl, summaryContent) {
		try {
			const currentCache = await this.getSummaryCache();

			// 查找是否已存在相同 URL 的缓存
			const existingIndex = currentCache.findIndex((item) => item.name === topicUrl);

			const newCacheItem = {
				name: topicUrl,
				value: summaryContent,
				timestamp: Date.now(),
			};

			if (existingIndex !== -1) {
				// 更新现有项
				currentCache[existingIndex] = newCacheItem;
			} else {
				// 添加新项
				currentCache.push(newCacheItem);
			}

			return await this.saveSummaryCache(currentCache);
		} catch (error) {
			console.error('添加/更新 AI 总结缓存失败：', error);
			return false;
		}
	}

	// 获取特定 URL 的缓存
	async getSummaryCacheByUrl(topicUrl) {
		try {
			const cache = await this.getSummaryCache();
			const found = cache.find((item) => item.name === topicUrl);
			return found ? found.value : null;
		} catch (error) {
			console.error('获取特定 URL 缓存失败：', error);
			return null;
		}
	}

	// 清理过期缓存（可选：清理超过指定天数的缓存）
	async cleanExpiredSummaryCache(daysToKeep = 30) {
		try {
			const cache = await this.getSummaryCache();
			const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

			const filteredCache = cache.filter((item) => {
				// 如果没有时间戳，保留（向后兼容）
				if (!item.timestamp) return true;
				return item.timestamp > cutoffTime;
			});

			if (filteredCache.length !== cache.length) {
				await this.saveSummaryCache(filteredCache);
				console.log(`清理了 ${cache.length - filteredCache.length} 个过期缓存`);
			}

			return true;
		} catch (error) {
			console.error('清理过期缓存失败：', error);
			return false;
		}
	}

	// 从 localStorage 迁移缓存数据到 IndexedDB
	async migrateSummaryCacheFromLocalStorage() {
		try {
			const localStorageData = localStorage.getItem('summaryCacheData');
			if (!localStorageData) {
				return true; // 没有数据需要迁移
			}

			const parsedData = JSON.parse(localStorageData);
			if (Array.isArray(parsedData) && parsedData.length > 0) {
				// 为旧数据添加时间戳
				const dataWithTimestamp = parsedData.map((item) => ({
					...item,
					timestamp: item.timestamp || Date.now(),
				}));

				const success = await this.saveSummaryCache(dataWithTimestamp);
				if (success) {
					// 迁移成功后删除 localStorage 数据
					localStorage.removeItem('summaryCacheData');
					console.log(`成功迁移 ${parsedData.length} 个 AI 总结缓存到 IndexedDB`);
				}
				return success;
			}
			return true;
		} catch (error) {
			console.error('迁移 AI 总结缓存失败：', error);
			return false;
		}
	}
}

// 創建全局實例
const dbStorage = new IndexedDBStorage();

export default dbStorage;
export { IndexedDBStorage };
