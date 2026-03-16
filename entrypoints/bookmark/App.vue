<template>
	<SidebarMenu
		:menutype="menutype"
		@toggleMenu="toggleMenu"
		@openAddPostDialog="openAddPostDialog"
		@openWebdavDialog="openWebdavDialog"
	/>
	<div class="flex">
		<div class="head-search">
			<a-input v-model="search" style="width: 300px" @input="searchPosts" placeholder="全局搜索标题..." />
		</div>

		<div class="aside">
			<div v-show="menutype == 'folder'">
				<div class="page-title">文件夹</div>
				<ul>
					<a-space>
						<a-button type="primary" @click="openCate">新建文件夹</a-button>
						<a-button @click="openAdminCate">管理文件夹</a-button>
					</a-space>
				</ul>
				<ul>
					<li
						v-for="item in sortedBookmarklist"
						:key="item.id"
						@click="selectItem(item.id)"
						:class="{ selected: item.id === selectedItemId }"
					>
						{{ item.name }} <em>{{ item.list.length }}</em>
					</li>
				</ul>
			</div>
			<div v-show="menutype == 'cate'">
				<div class="page-title">类别</div>
				<ul>
					<li
						v-for="item in catelist"
						:key="item.id"
						@click="selectItemCate(item.id)"
						:class="{ selected: item.id === selectItemCateId }"
					>
						<img v-if="item.logo" :src="`${item.logo}`" class="category-icon" />
						<span :style="{ color: '#' + item.color }">{{ item.name }}</span>
						<em>{{ item.list.length }}</em>
					</li>
				</ul>
			</div>
			<div v-show="menutype == 'tags'">
				<div class="page-title">标签</div>
				<ul>
					<li
						v-for="item in tagslist"
						:key="item.id"
						@click="selectItemTags(item.id)"
						:class="{ selected: item.id === selectItemTagsId }"
					>
						{{ item.name }} <em>{{ item.list.length }}</em>
					</li>
				</ul>
			</div>
		</div>

		<div class="container">
			<a-table :data="sortedTableData" :loading="loading" :pagination="false">
				<template #columns>
					<a-table-column title="标题" data-index="title">
						<template #cell="{ record }">
							<a :href="record.url" target="_blank">{{ record.title }}</a>
						</template>
					</a-table-column>

					<a-table-column title="类别" data-index="cate" :width="200">
						<template #cell="{ record }">
							<div class="category-cell">
								<img
									v-if="getCategoryInfo(record.cate)?.uploaded_logo"
									:src="`${getCategoryInfo(record.cate).uploaded_logo.url}`"
									class="category-icon"
								/>
								<span>{{ record.cate }}</span>
							</div>
						</template>
					</a-table-column>

					<a-table-column title="标签" data-index="tags" :width="200">
						<template #cell="{ record }">
							{{ record.tags.join('，') }}
						</template>
					</a-table-column>

					<!-- <a-table-column title="排序" data-index="tags" :width="100">
            <template #cell="{ record }">
              <a-input
                v-model="record.sort"
                @blur="updateBookmarkList(record)"
                type="number"
                :min="1"
                style="width: 60px"
              />
            </template>
          </a-table-column> -->

					<a-table-column v-if="menutype === 'folder'" title="操作" :width="180" fixed="right">
						<template #cell="{ record }">
							<a-tag @click="openMoveDialog(record)">修改</a-tag>
							<a-tag style="margin-left: 10px" color="red" @click="openDelDialog(record)">删除</a-tag>
						</template>
					</a-table-column>
				</template>
			</a-table>
		</div>
	</div>

	<transition name="fade">
		<div class="gotop" v-show="showGoTop" @click="gotop">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="50"
				height="50"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="icon icon-tabler icons-tabler-filled icon-tabler-square-chevron-up"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<path
					d="M19 2a3 3 0 0 1 3 3v14a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-14a3 3 0 0 1 3 -3zm-6.387 7.21a1 1 0 0 0 -1.32 .083l-3 3l-.083 .094a1 1 0 0 0 .083 1.32l.094 .083a1 1 0 0 0 1.32 -.083l2.293 -2.292l2.293 2.292l.094 .083a1 1 0 0 0 1.32 -1.497l-3 -3z"
				/>
			</svg>
		</div>
	</transition>

	<!-- 新增文件夹 -->
	<a-modal v-model:visible="dialogVisible" title="新建文件夹" width="500px">
		<p style="margin-bottom: 5px">请输入文件夹名称</p>
		<a-input v-model="newcatename" style="width: 240px" />
		<template #footer>
			<div class="dialog-footer">
				<a-space>
					<a-button @click="dialogVisible = false">取消</a-button>
					<a-button type="primary" @click="addCate">确认</a-button>
				</a-space>
			</div>
		</template>
	</a-modal>

	<!-- 管理文件夹 -->
	<a-modal v-model:visible="AdmindialogVisible" title="管理文件夹" width="500px" :footer="false">
		<p style="color: #e00; margin-bottom: 10px">删除文件夹时会连同该文件夹下的帖子一起删除，无法恢复请谨慎操作！</p>
		<a-table :data="sortedBookmarklist" :pagination="false">
			<template #columns>
				<a-table-column title="文件夹名称" data-index="name" min-width="120" />
				<a-table-column title="排序" width="140">
					<template #cell="{ record }">
						<a-input
							v-if="!editingId || editingId !== record.id"
							v-model="record.sort"
							@click="startEditing(record)"
							type="number"
							:min="1"
							readonly
						/>
						<a-input
							v-else
							v-model="temporaryValue"
							@blur="finishEditing(record)"
							type="number"
							:min="1"
							ref="editInput"
							@keyup.enter="finishEditing(record)"
						/>
					</template>
				</a-table-column>
				<a-table-column title="操作" min-width="140">
					<template #cell="{ record }">
						<a-tag @click="openEditDialog(record)">修改</a-tag>
						<a-popconfirm content="最后确认删除？" @ok="deleteSelected(record)">
							<a-tag style="margin-left: 10px" color="red">删除</a-tag>
						</a-popconfirm>
					</template>
				</a-table-column>
			</template>
		</a-table>

		<!-- 修改文件夹名称对话框 -->
		<a-modal v-model:visible="editDialogVisible" title="修改文件夹名称" width="400px">
			<a-input v-model="editCateName" placeholder="请输入新的文件夹名称"></a-input>
			<template #footer>
				<div class="dialog-footer">
					<a-button type="primary" @click="updateCateName">修改</a-button>
				</div>
			</template>
		</a-modal>
	</a-modal>

	<!-- 修改对话框 -->
	<a-modal v-model:visible="moveDialogVisible" title="修改书签" width="500px" class="modify-box">
		<div class="item">
			<label>修改名称</label>
			<a-input v-model="editname" />
		</div>
		<div class="item">
			<label>迁移至</label>
			<a-select v-model="targetCategoryId" placeholder="选择目标文件夹" style="width: 100%">
				<a-option
					v-for="category in filteredCategories"
					:key="category.id"
					:label="category.name"
					:value="category.id"
				/>
			</a-select>
		</div>
		<template #footer>
			<div class="dialog-footer">
				<a-space>
					<a-button @click="moveDialogVisible = false">取消</a-button>
					<a-button type="primary" @click="moveItem">确认</a-button>
				</a-space>
			</div>
		</template>
	</a-modal>

	<!-- 删除指定帖子的对话框 -->
	<a-modal v-model:visible="delDialogVisible" title="删除收藏贴子" width="400px">
		<p>是否真的删除？</p>
		<template #footer>
			<div class="dialog-footer">
				<a-space>
					<a-button @click="delDialogVisible = false">取消</a-button>
					<a-button status="danger" @click="confirmDelete">删除</a-button>
				</a-space>
			</div>
		</template>
	</a-modal>

	<!-- Webdav 同步 -->
	<a-modal v-model:visible="WebdavDialog" title="收藏夹设置" :footer="false" width="550px">
		<div class="item-title">Webdav 同步</div>
		<a-form :model="webdavConfig" label-width="100px">
			<a-form-item label="服务器地址：">
				<a-input v-model="webdavConfig.serverUrl" placeholder="https://example.com/dav/" />
			</a-form-item>
			<a-form-item label="用户名：">
				<a-input v-model="webdavConfig.username" placeholder="用户名" />
			</a-form-item>
			<a-form-item label="密码：">
				<a-input type="password" v-model="webdavConfig.password" placeholder="密码" />
			</a-form-item>
		</a-form>
		<div class="webdav-actions">
			<a-button type="primary" @click="saveWebDAVConfig">保存配置</a-button>
		</div>

		<a-divider>云端同步操作</a-divider>
		<div class="webdav-sync-actions">
			<a-space>
				<a-button @click="exportToWebDAV" :loading="exporting">导出到 WebDAV</a-button>
				<a-button @click="importFromWebDAV" :loading="importing">从 WebDAV 导入</a-button>
			</a-space>
		</div>
		<a-divider>手动同步操作</a-divider>
		<a-space>
			<a-button @click="exportData">导出 json 文件</a-button>
			<label
				for="file-upload"
				class="arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal"
				>导入 json 文件</label
			>
			<input id="file-upload" type="file" @change="importData" style="display: none" />
		</a-space>
		<br /><br />
		<div class="item-title">其他设置</div>
		<div class="item">
			<label>主题风格：</label>
			<a-radio-group type="button" v-model="themes" @change="setThemes">
				<a-radio value="light">明亮</a-radio>
				<a-radio value="dark">黑夜</a-radio>
			</a-radio-group>
		</div>
	</a-modal>

	<!-- 手动新增收藏链接 -->
	<a-modal v-model:visible="addPostDialogVisible" title="添加书签" width="550px" class="addPost">
		<a-input v-model="autoaccessstr" placeholder="https://linux.do/t/topic/309543/372" />
		<a-button type="primary" @click="autoAccess" :loading="autoAccessLoading">自动解析</a-button>
		<a-divider />
		<div class="item">
			<label>URL：<span>*</span></label>
			<a-input v-model="addPost.url" />
		</div>
		<div class="item">
			<label>标题：<span>*</span></label>
			<a-input v-model="addPost.title" />
		</div>
		<div class="item">
			<label>分类：</label>
			<a-input v-model="addPost.cate" />
		</div>
		<div class="item">
			<label>标签：</label>
			<a-input v-model="addPost.tags" placeholder="使用英文逗号,相连" />
		</div>
		<template #footer>
			<div class="dialog-footer">
				<a-space>
					<a-button @click="addPostDialogVisible = false">取消</a-button>
					<a-button type="primary" @click="setAddAccess">添加</a-button>
				</a-space>
			</div>
		</template>
	</a-modal>
</template>

<script>
// WebDAVClient 类定义
class WebDAVClient {
	constructor(serverUrl, username, password) {
		if (!serverUrl || typeof serverUrl !== 'string') {
			throw new Error('服务器地址不能为空');
		}
		this.serverUrl = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/';
		this.auth = 'Basic ' + btoa(username + ':' + password);
	}

	async request(method, path, data = null, headers = {}) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			// 移除路径开头的斜杠，并编码路径中的特殊字符
			path = path.replace(/^\/+/, '');
			const url = this.serverUrl + path;

			xhr.open(method, url, true);

			// 添加认证头
			xhr.setRequestHeader('Authorization', this.auth);

			// 添加其他头部
			Object.entries(headers).forEach(([key, value]) => {
				xhr.setRequestHeader(key, value);
			});

			xhr.onload = function () {
				if (xhr.status >= 200 && xhr.status < 300) {
					resolve(xhr.response);
				} else {
					reject(new Error(`请求失败: ${xhr.status} ${xhr.statusText}`));
				}
			};

			xhr.onerror = function () {
				reject(new Error('网络请求失败'));
			};

			// 正确地处理请求体
			if (data) {
				// 如果是字符串，直接发送
				if (typeof data === 'string') {
					xhr.send(data);
				}
				// 如果是对象，转换为JSON字符串
				else if (typeof data === 'object') {
					xhr.send(JSON.stringify(data));
				}
			} else {
				xhr.send();
			}
		});
	}

	async putFile(path, content) {
		return this.request('PUT', path, content, {
			'Content-Type': 'application/json;charset=UTF-8',
		});
	}

	async getFile(path) {
		return this.request('GET', path);
	}

	async exists(path) {
		try {
			await this.request('PROPFIND', path, null, {
				Depth: '0',
			});
			return true;
		} catch (e) {
			if (e.message.includes('404')) {
				return false;
			}
			throw e;
		}
	}

	async createDirectory(path) {
		return this.request('MKCOL', path);
	}
}

import categoryMap from './data/categoryMap.js';
import SidebarMenu from './components/SidebarMenu.vue';

export default {
	components: {
		SidebarMenu,
	},
	data() {
		return {
			loading: false,
			categoryMap: categoryMap.categoryMap,

			// 切换页面类型
			menutype: 'folder',

			// 分类
			selectItemCateId: 0,
			catelist: [],

			// 标签
			selectItemTagsId: 0,
			tagslist: [],

			// 全部文件夹
			selectedItemId: 0,
			bookmarklist: [
				{
					id: 0,
					name: '默认',
					list: [],
					sort: 1,
				},
			],
			tableData: {}, // 页面渲染的指定数据

			// 新增分类
			dialogVisible: false,
			newcatename: '',

			// 管理分类
			AdmindialogVisible: false,
			multipleSelection: [],

			editDialogVisible: false, // 控制修改对话框的显示
			editCateName: '', // 编辑中的分类名称
			currentEditCate: null, // 当前编辑的分类对象

			editname: '',
			// 转移动作
			moveDialogVisible: false,
			currentMoveItem: null, // 当前要转移的项
			targetCategoryId: null, // 目标分类 ID

			// 删除指定帖子
			delDialogVisible: false,

			// webdav 同步
			WebdavDialog: false,
			webdavConfig: {
				serverUrl: '',
				username: '',
				password: '',
				folder: 'linuxdo-scripts-backup/', // 默认文件夹
				filename: JSON.stringify(localStorage.getItem('bookmarkData')),
			},
			importing: false,
			exporting: false,

			showGoTop: false, // 控制返回顶部按钮的显示

			// 搜索功能
			search: '',

			// 手动新增收藏链接
			addPostDialogVisible: false,
			autoaccessstr: '', // 自动填充
			autoAccessLoading: false,
			addPost: {
				url: '',
				title: '',
				cate: '',
				tags: '',
			},

			// 黑夜模式
			themes: 'light', // light / dark

			editingId: null, // 当前正在编辑的记录ID
			temporaryValue: null, // 临时存储的值
		};
	},
	computed: {
		// 文件夹根据 sort 排序
		sortedBookmarklist() {
			// 返回根据sort字段降序排序的数组（数字大的在前，小的在后）
			return [...this.bookmarklist].sort((a, b) => {
				// 确保 sort 存在，如果不存在则默认为 1
				const sortA = a.sort || 1;
				const sortB = b.sort || 1;
				return sortB - sortA; // 降序排列
			});
		},
		// 主体表格排序
		sortedTableData() {
			// 如果原始数据不存在，返回空数组
			if (!this.tableData || !this.tableData.list) {
				return [];
			}

			// 返回根据 sort 字段降序排序的数组（数字大的在前，小的在后）
			return [...this.tableData.list].sort((a, b) => {
				// 确保 sort 存在，如果不存在则默认为 1
				const sortA = a.sort || 1;
				const sortB = b.sort || 1;
				return sortB - sortA; // 降序排列
			});
		},
		filteredCategories() {
			// return this.bookmarklist.filter((item) => item.id);
			// 迁移文件夹时，要看到全部的文件夹
			return this.bookmarklist;
		},
	},
	methods: {
		// 开始编辑时触发
		startEditing(record) {
			this.editingId = record.id; // 或其他唯一标识
			this.temporaryValue = record.sort; // 复制当前值到临时变量
			this.$nextTick(() => {
				// 聚焦到编辑输入框
				if (this.$refs.editInput) {
					this.$refs.editInput.focus();
				}
			});
		},

		// 结束编辑时触发
		finishEditing(record) {
			// 更新记录的值
			record.sort = this.temporaryValue;

			// 调用更新方法
			this.updateBookmarkData(record);

			// 重置编辑状态
			this.editingId = null;
		},

		// 文件夹修改排序
		updateBookmarkData(record) {
			record.sort = Number(record.sort);
			localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
		},
		updateBookmarkList(record) {
			// 确保 sort 是数字类型
			record.sort = Number(record.sort);

			// 找到当前选中的书签文件夹
			const currentFolder = this.bookmarklist.find((item) => item.id === this.selectedItemId);
			if (currentFolder) {
				// 更新本地存储
				localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
			}
		},
		// 搜索帖子标题关键词
		searchPosts() {
			if (this.search == '') {
				// this.tableData = this.bookmarklist[this.selectedItemId];
				this.tableData = this.bookmarklist[0];
				return false;
			}

			const keyword = this.search.toLowerCase();
			const results = [];

			this.bookmarklist.forEach((folder) => {
				const matches = folder.list.filter((post) => post.title.toLowerCase().includes(keyword));
				results.push(...matches);
			});

			// 将结果转换为所需格式
			const searchResults = {
				id: -1,
				name: '搜索',
				list: results,
			};

			this.tableData = searchResults;

			return searchResults;
		},
		// 模拟加载刷新
		Loading() {
			this.search = '';
			this.loading = true;
			setTimeout(() => {
				this.loading = false;
			}, 100);
		},
		// 切换左侧页面类型
		toggleMenu(val) {
			this.menutype = val;
			this.selectedItemId = -1;
			this.selectItemCateId = -1;
			this.selectItemTagsId = -1;
		},
		selectItem(id) {
			this.selectedItemId = id;
			this.tableData = this.bookmarklist.find((item) => item.id === id);
			// console.log(this.tableData);

			this.Loading();
		},
		init() {
			this.selectedItemId = this.bookmarklist[0].id;
			this.tableData = this.bookmarklist[0];
			this.isSort();
		},
		// 打开新建文件夹弹窗
		openCate() {
			this.dialogVisible = true;
		},
		// 新增文件夹
		addCate() {
			if (this.newcatename.trim() === '') {
				this.$message.error('文件夹名称不能为空');
				return;
			}
			const maxId = this.bookmarklist.reduce((max, item) => Math.max(max, item.id), 0);
			const newCate = {
				id: maxId + 1,
				name: this.newcatename.trim(),
				list: [],
				sort: 1,
			};
			this.bookmarklist.push(newCate);
			this.$message.success(`新增文件夹【${this.newcatename}】成功!`);
			this.newcatename = '';
			this.dialogVisible = false;
			localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
		},

		// 打开管理文件夹弹窗
		openAdminCate() {
			this.AdmindialogVisible = true;
		},
		handleSelectionChange(val) {
			this.multipleSelection = val;
		},
		// 删除文件夹
		deleteSelected(delItem) {
			this.bookmarklist = this.bookmarklist.filter((item) => item !== delItem);
			this.multipleSelection = [];
			this.$message.success('删除成功！');
			// this.AdmindialogVisible = false;
			this.initPostCategory();
			this.initPostTags();
			localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
		},
		// 打开修改弹窗
		openEditDialog(row) {
			this.currentEditCate = row;
			this.editCateName = row.name;
			this.editDialogVisible = true;
		},
		// 确认修改
		updateCateName() {
			if (this.editCateName.trim() === '') {
				this.$message.error('文件夹名称不能为空');
				return;
			}

			// 更新文件夹名称
			this.currentEditCate.name = this.editCateName;
			this.editDialogVisible = false;
			localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
		},

		// 打开修改框
		openMoveDialog(row) {
			this.editname = row.title;
			this.currentMoveItem = row;
			this.targetCategoryId = this.selectedItemId;
			this.moveDialogVisible = true;
		},
		// 保存修改操作（修改名称、迁移文件夹）
		moveItem() {
			if (this.targetCategoryId === null) {
				this.$message.error('请选择目标文件夹');
				return;
			}

			// 更新标题名称
			if (this.editname !== this.currentMoveItem.title) {
				this.currentMoveItem.title = this.editname;
			}

			// 查找目标文件夹
			const targetCategory = this.bookmarklist.find((item) => item.id === this.targetCategoryId);

			// 在所有文件夹中查找并移除项目
			let itemMoved = false;
			this.bookmarklist.forEach((folder) => {
				const index = folder.list.findIndex((item) => item === this.currentMoveItem);
				if (index > -1) {
					folder.list.splice(index, 1);
					itemMoved = true;
				}
			});

			// 添加到目标文件夹最前面
			if (itemMoved) {
				targetCategory.list.unshift(this.currentMoveItem); // 改用 unshift 添加到数组开头

				// 根据当前视图更新显示
				if (this.menutype === 'tags') {
					this.initPostTags();
					if (this.selectItemTagsId >= this.tagslist.length) {
						this.selectItemTagsId = Math.max(0, this.tagslist.length - 1);
					}
					this.tableData = this.tagslist.length > 0 ? this.tagslist[this.selectItemTagsId] : { list: [] };
				} else if (this.menutype === 'cate') {
					this.initPostCategory();
					if (this.selectItemCateId >= this.catelist.length) {
						this.selectItemCateId = Math.max(0, this.catelist.length - 1);
					}
					this.tableData = this.catelist.length > 0 ? this.catelist[this.selectItemCateId] : { list: [] };
				} else {
					this.tableData = this.bookmarklist.find((item) => item.id === this.selectedItemId);
				}

				this.$message.success('修改成功！');
				this.moveDialogVisible = false;
				localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
				this.Loading();
			}
		},

		openDelDialog(row) {
			this.deleteRow = row; // 保存要删除的行数据
			this.delDialogVisible = true; // 显示删除对话框
		},

		// 删除指定帖子
		confirmDelete() {
			// 从所有文件夹中查找并删除该项目
			this.bookmarklist.forEach((folder) => {
				const index = folder.list.findIndex((item) => item === this.deleteRow);
				if (index > -1) {
					folder.list.splice(index, 1);
				}
			});

			// 如果在标签视图下，也需要更新 tagslist
			if (this.menutype === 'tags') {
				this.initPostTags(); // 重新初始化标签列表
				// 检查索引是否仍然有效
				if (this.selectItemTagsId >= this.tagslist.length) {
					this.selectItemTagsId = Math.max(0, this.tagslist.length - 1);
				}
				this.tableData = this.tagslist.length > 0 ? this.tagslist[this.selectItemTagsId] : { list: [] };
			}
			// 如果在分类视图下，更新 catelist
			else if (this.menutype === 'cate') {
				this.initPostCategory(); // 重新初始化分类列表
				// 检查索引是否仍然有效
				if (this.selectItemCateId >= this.catelist.length) {
					this.selectItemCateId = Math.max(0, this.catelist.length - 1);
				}
				this.tableData = this.catelist.length > 0 ? this.catelist[this.selectItemCateId] : { list: [] };
			}
			// 如果在文件夹视图下，更新当前文件夹数据
			else {
				// this.tableData = this.bookmarklist[this.selectedItemId];
				this.tableData = this.bookmarklist.find((item) => item.id === this.selectedItemId);
			}

			this.delDialogVisible = false;
			this.deleteRow = null;
			localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
			this.$message.success('删除成功！');
			this.initPostCategory();
			this.initPostTags();
			this.Loading();
		},

		// 手动导出书签数据
		exportData() {
			const blob = new Blob([JSON.stringify(this.bookmarklist)], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'bookmarkData.json';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			this.$message('导出成功，请妥善保存 json 文件！');
		},
		// 手动导入书签数据
		importData(event) {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const data = JSON.parse(e.target.result);
						// 简单的验证数据结构
						if (Array.isArray(data)) {
							// 创建一个 Map 用于存储按 name 分组的数据
							const mergedMap = new Map();

							// 先处理现有数据
							this.bookmarklist.forEach((bookmark) => {
								if (mergedMap.has(bookmark.name)) {
									// 如果已存在相同 name，合并 list
									mergedMap.get(bookmark.name).list.push(...bookmark.list);
								} else {
									// 不存在则添加新条目
									mergedMap.set(bookmark.name, {
										id: bookmark.id,
										name: bookmark.name,
										list: [...bookmark.list],
										sort: bookmark.sort,
									});
								}
							});

							// 处理新数据
							data.forEach((bookmark) => {
								if (mergedMap.has(bookmark.name)) {
									// 存在相同 name 则合并 list
									mergedMap.get(bookmark.name).list.push(...bookmark.list);
								} else {
									// 不存在则添加新条目
									mergedMap.set(bookmark.name, {
										id: bookmark.id,
										name: bookmark.name,
										list: [...bookmark.list],
										sort: bookmark.sort,
									});
								}
							});

							// 对每个分组的 list 去重
							mergedMap.forEach((bookmark) => {
								const uniqueUrls = new Map();
								bookmark.list = bookmark.list.filter((item) => {
									if (!uniqueUrls.has(item.url)) {
										uniqueUrls.set(item.url, true);
										return true;
									}
									return false;
								});
							});

							// 转换回数组形式
							this.bookmarklist = Array.from(mergedMap.values());

							// this.tableData = this.bookmarklist[this.selectedItemId]
							this.tableData = this.bookmarklist.find((item) => item.id === this.selectedItemId);
							localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
							this.$message.success('导入成功');
							this.Loading();
						} else {
							this.$message.error('导入数据格式有问题');
						}
					} catch (ex) {
						this.$message.error('导入数据解析出错');
					}
				};
				reader.readAsText(file);
			}
		},

		/*
		 * 初始化帖子分类
		 */
		initPostCategory() {
			this.catelist = this.bookmarklist.reduce((acc, folder) => {
				folder.list.forEach((item) => {
					const existingCategory = acc.find((cat) => cat.name === item.cate);
					const categoryInfo = this.categoryMap.find((c) => c.name === item.cate);

					if (existingCategory) {
						existingCategory.list.push(item);
					} else {
						acc.push({
							id: acc.length,
							name: item.cate,
							list: [item],
							color: categoryInfo?.color || '',
							logo: categoryInfo?.uploaded_logo?.url || '',
						});
					}
				});

				return acc;
			}, []);
		},
		selectItemCate(id) {
			this.selectItemCateId = id;
			this.tableData = this.catelist[this.selectItemCateId];
			this.Loading();
		},

		/*
		 * 初始化标签
		 */
		initPostTags() {
			this.tagslist = this.bookmarklist.reduce((acc, folder) => {
				folder.list.forEach((item) => {
					item.tags.forEach((tag) => {
						const existingTag = acc.find((t) => t.name === tag);

						if (existingTag) {
							existingTag.list.push(item);
						} else {
							acc.push({
								id: acc.length,
								name: tag,
								list: [item],
							});
						}
					});
				});
				return acc;
			}, []);
		},
		selectItemTags(id) {
			this.selectItemTagsId = id;
			this.tableData = this.tagslist[this.selectItemTagsId];
			this.Loading();
		},

		/*
		 * webdav 同步
		 */
		openWebdavDialog() {
			this.WebdavDialog = true;
		},
		// 获取完整的文件路径
		getFullPath() {
			let folder = this.webdavConfig.folder.trim();
			// 确保文件夹路径以/开头和结尾
			if (!folder.startsWith('/')) folder = '/' + folder;
			if (!folder.endsWith('/')) folder = folder + '/';
			return folder + this.webdavConfig.filename.trim();
		},

		// 导出方法
		async exportToWebDAV() {
			try {
				this.exporting = true;
				const config = JSON.parse(localStorage.getItem('webdavConfig'));
				if (!config) {
					throw new Error('请先配置 WebDAV 信息');
				}

				const client = new WebDAVClient(config.serverUrl, config.username, atob(config.password));

				// 规范化文件夹路径
				let folder = config.folder || '';
				folder = folder.replace(/^\/+|\/+$/g, ''); // 移除开头和结尾的斜杠
				if (folder) {
					folder += '/';
				}

				// 确保文件夹存在
				if (folder) {
					try {
						const exists = await client.exists(folder);
						if (!exists) {
							await client.createDirectory(folder);
						}
					} catch (error) {
						throw new Error('创建文件夹失败：' + error.message);
					}
				}

				// 正确构建文件路径
				const filePath = folder + 'bookmarks.json'; // 使用固定的文件名

				// 将数据转换为 JSON 字符串
				const bookmarkData = JSON.stringify(this.bookmarklist);

				// 上传文件
				await client.putFile(filePath, bookmarkData);

				this.$message.success('导出到 WebDAV 成功');
			} catch (error) {
				console.error('导出错误：', error);
				this.$message.error('导出失败：' + error.message);
			} finally {
				this.exporting = false;
			}
		},

		// 导入方法
		async importFromWebDAV() {
			try {
				this.importing = true;
				const config = JSON.parse(localStorage.getItem('webdavConfig'));
				if (!config) {
					throw new Error('请先配置 WebDAV 信息');
				}

				const client = new WebDAVClient(config.serverUrl, config.username, atob(config.password));

				// 规范化文件夹路径
				let folder = config.folder || '';
				folder = folder.replace(/^\/+|\/+$/g, ''); // 移除开头和结尾的斜杠
				if (folder) {
					folder += '/';
				}

				// 使用和导出相同的文件路径
				const filePath = folder + 'bookmarks.json';

				// 检查文件是否存在
				const exists = await client.exists(filePath);
				if (!exists) {
					throw new Error('WebDAV 服务器上未找到书签文件');
				}

				// 读取文件内容
				const content = await client.getFile(filePath);

				try {
					// 解析 JSON 数据
					const data = JSON.parse(content);
					if (Array.isArray(data)) {
						// 创建一个 Map 用于存储按 name 分组的数据
						const mergedMap = new Map();

						// 先处理现有数据
						this.bookmarklist.forEach((bookmark) => {
							// 通过 id 查找是否已存在
							const existingBookmark = Array.from(mergedMap.values()).find((item) => item.id === bookmark.id);

							if (existingBookmark) {
								// 存在相同 id 的对象，只合并 list 数据，保留 existingBookmark 的其他数据
								existingBookmark.list.push(...bookmark.list);
							} else {
								// 不存在相同 id，添加新条目
								mergedMap.set(bookmark.name, {
									id: bookmark.id,
									name: bookmark.name,
									list: [...bookmark.list],
									sort: bookmark.sort,
								});
							}
						});

						// 处理新数据
						data.forEach((bookmark) => {
							if (mergedMap.has(bookmark.name)) {
								// 存在相同 name 则合并 list
								mergedMap.get(bookmark.name).list.push(...bookmark.list);
							} else {
								// 不存在则添加新条目
								mergedMap.set(bookmark.name, {
									id: bookmark.id,
									name: bookmark.name,
									list: [...bookmark.list],
									sort: bookmark.sort,
								});
							}
						});

						// 对每个分组的 list 去重
						mergedMap.forEach((bookmark) => {
							const uniqueUrls = new Map();
							// 反转数组，这样后面的会先被处理，从而覆盖前面的
							bookmark.list = bookmark.list
								.reverse()
								.filter((item) => {
									if (!uniqueUrls.has(item.url)) {
										uniqueUrls.set(item.url, true);
										return true;
									}
									return false;
								})
								.reverse(); // 再反转回来保持原有顺序
						});

						// 转换回数组形式
						this.bookmarklist = Array.from(mergedMap.values());

						// this.tableData = this.bookmarklist[this.selectedItemId];
						this.tableData = this.bookmarklist.find((item) => item.id === this.selectedItemId);
						localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
						this.initPostCategory();
						this.initPostTags();
						this.$message.success('从 WebDAV 导入成功');
						this.Loading();
					} else {
						throw new Error('导入的数据格式不正确');
					}
				} catch (e) {
					throw new Error('解析导入的数据失败：' + e.message);
				}
			} catch (error) {
				console.error('导入错误：', error);
				this.$message.error('导入失败：' + error.message);
			} finally {
				this.importing = false;
			}
		},

		async checkAndRequestPermission(url) {
			var browserAPI = typeof browser !== 'undefined' ? browser : chrome;
			try {
				if (!url.startsWith('http://') && !url.startsWith('https://')) {
					throw new Error('URL 必须以 http://或 https://开头');
				}

				let origin;
				try {
					const cleanUrl = url.replace(/\/$/, '');
					origin = new URL(cleanUrl).origin + '/*';
				} catch (e) {
					throw new Error('无效的 URL 格式');
				}

				try {
					const existingPermissions = await browserAPI.permissions.contains({
						origins: [origin],
					});

					if (!existingPermissions) {
						const granted = await browserAPI.permissions.request({
							origins: [origin],
						});

						if (!granted) {
							throw new Error('用户拒绝了权限请求');
						}
					}
				} catch (e) {
					console.error('权限请求错误：', e);
					throw new Error('权限请求失败，请确保 URL 正确且已授予权限');
				}

				return true;
			} catch (error) {
				throw error;
			}
		},

		// 保存配置
		async saveWebDAVConfig() {
			try {
				// 先验证所有必填字段是否存在且不为空
				const config = {
					serverUrl: (this.webdavConfig?.serverUrl || '').trim(),
					username: (this.webdavConfig?.username || '').trim(),
					password: this.webdavConfig?.password || '',
					folder: 'linuxdo-scripts-backup/',
					filename: JSON.stringify(localStorage.getItem('bookmarkData')),
				};

				// 验证必填字段
				const requiredFields = {
					服务器地址: config.serverUrl,
					用户名: config.username,
					密码: config.password,
					文件名: config.filename,
				};

				for (const [field, value] of Object.entries(requiredFields)) {
					if (!value) {
						throw new Error(`${field}不能为空`);
					}
				}

				// 验证 URL 格式
				if (!config.serverUrl.startsWith('http://') && !config.serverUrl.startsWith('https://')) {
					throw new Error('服务器地址必须以 http:// 或 https:// 开头');
				}

				try {
					// 测试 URL 是否有效
					new URL(config.serverUrl);
				} catch (e) {
					throw new Error('无效的服务器地址格式');
				}

				// 规范化 URL 和文件夹路径
				config.serverUrl = config.serverUrl.endsWith('/') ? config.serverUrl : config.serverUrl + '/';
				config.folder = config.folder.endsWith('/') ? config.folder : config.folder + '/';
				config.folder = config.folder.startsWith('/') ? config.folder.substring(1) : config.folder;

				// 请求权限
				await this.checkAndRequestPermission(config.serverUrl);

				// 创建客户端并测试连接
				const client = new WebDAVClient(config.serverUrl, config.username, config.password);

				try {
					await client.exists('/');
				} catch (e) {
					console.error('连接测试失败：', e);
					throw new Error('无法连接到 WebDAV 服务器，请检查配置是否正确');
				}

				// 存储配置
				localStorage.setItem(
					'webdavConfig',
					JSON.stringify({
						...config,
						password: btoa(config.password),
					}),
				);

				this.$message.success('WebDAV 配置保存成功');
			} catch (error) {
				console.error('保存配置错误：', error);
				this.$message.error(error.message || '保存配置失败');
			}
		},

		async requestWebDAVPermission(webdavUrl) {
			const url = new URL(webdavUrl);
			const pattern = `${url.protocol}//${url.hostname}/*`;

			try {
				const granted = await chrome.permissions.request({
					origins: [pattern],
				});
				return granted;
			} catch (err) {
				console.error('Permission request failed:', err);
				return false;
			}
		},

		// 给帖子类别增加颜色
		getCategoryInfo(cateName) {
			return this.categoryMap.find((cat) => cat.name === cateName);
		},

		// gotop 点击返回顶部
		handleScroll() {
			// 当滚动超过 200px 时显示按钮
			this.showGoTop = window.scrollY > 200;
		},

		// 返回顶部
		gotop() {
			const currentPosition = window.pageYOffset || document.documentElement.scrollTop;
			if (currentPosition > 0) {
				window.requestAnimationFrame(this.gotop);
				window.scrollTo(0, currentPosition - currentPosition / 8);
			}
		},

		/*
		 * 手动新增收藏链接
		 */
		openAddPostDialog() {
			this.addPostDialogVisible = true;
		},
		// 匹配类别 ID
		getCategoryNameById(categoryId) {
			const category = this.categoryMap.find((item) => item.id === categoryId);
			return category ? category.name : '';
		},
		clearAccess() {
			this.autoaccessstr = '';
			this.addPost = {
				url: '',
				title: '',
				cate: '',
				tags: '',
			};
		},
		// 解析链接
		async autoAccess() {
			if (!this.autoaccessstr) {
				this.$message.warning('请先输入需要解析的 linux.do  URL！');
				return false;
			}
			this.autoAccessLoading = true;
			try {
				// 使用 URL 对象方便地解析 URL
				const url = new URL(this.autoaccessstr);
				const pathname = url.pathname; // e.g., "/t/topic/309543/372"
				const [section, topic, id, page] = pathname.split('/').filter(Boolean); // 拆分路径部分

				fetch(`https://linux.do/t/${id}.json`)
					.then((response) => response.json())
					.then((data) => {
						this.addPost = {
							url: `https://linux.do/t/topic/${id}`,
							title: data.title,
							cate: this.getCategoryNameById(data.category_id),
							tags: Array.isArray(data.tags) ? data.tags.join(',') : data.tags,
						};
						this.autoAccessLoading = false;
						this.$message.success('解析成功，正在填充数据...');
					});
			} catch (error) {
				console.error('Invalid URL format:', error.message);
				this.$message.error('解析失败！');
				this.autoAccessLoading = false;
			}
		},
		// 确认填充
		setAddAccess() {
			if (this.addPost.title == '' || this.addPost.url == '') {
				this.$message('请勿留空必填项！');
				return false;
			}
			this.addPostDialogVisible = false;
			// 确保 tags 是数组结构，将字符串以逗号分隔成数组，并去除多余空格
			const tagsArr = this.addPost.tags.split(',').map((tag) => tag.trim());
			this.bookmarklist[0].list.unshift({
				url: this.addPost.url,
				title: this.addPost.title,
				cate: this.addPost.cate,
				tags: tagsArr,
			});
			this.initPostCategory();
			this.initPostTags();
			this.Loading();
			localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
			this.$message.success('新增成功！');
			this.clearAccess();
		},

		/*
		 * 切换风格主题
		 */
		setThemes() {
			localStorage.setItem('themes', this.themes);
			if (this.themes == 'dark') {
				// 设置为暗黑主题
				document.body.setAttribute('arco-theme', 'dark');
			} else {
				// 恢复亮色主题
				document.body.removeAttribute('arco-theme');
			}
		},

		// 判断是否有排序字段
		isSort() {
			const bookmarkData = localStorage.getItem('bookmarkData');
			if (bookmarkData && JSON.parse(bookmarkData).length > 0) {
				this.bookmarklist = JSON.parse(bookmarkData);
			} else {
				localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
			}

			// 遍历书签列表中的每个分类
			this.bookmarklist.forEach((category) => {
				// 若分类没有 sort 字段，添加默认值 1
				if (!category.hasOwnProperty('sort')) {
					category.sort = 1;
				}

				// 遍历分类中的每个书签
				if (category.list && Array.isArray(category.list)) {
					category.list.forEach((bookmark) => {
						// 若书签没有 sort 字段，添加默认值 1
						if (!bookmark.hasOwnProperty('sort')) {
							bookmark.sort = 1;
						}
					});
				}
			});

			// 更新本地存储中的数据
			localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
			console.log(this.bookmarklist);
		},
	},
	mounted() {
		// 添加滚动监听
		window.addEventListener('scroll', this.handleScroll);
	},
	beforeDestroy() {
		// 组件销毁前移除监听
		window.removeEventListener('scroll', this.handleScroll);
	},
	created() {
		// 获取风格主题
		const themes = localStorage.getItem('themes');
		if (themes) {
			this.themes = themes;
			if (this.themes == 'dark') {
				// 设置为暗黑主题
				document.body.setAttribute('arco-theme', 'dark');
			} else {
				// 恢复亮色主题
				document.body.removeAttribute('arco-theme');
			}
		}

		const bookmarkData = localStorage.getItem('bookmarkData');
		if (bookmarkData && JSON.parse(bookmarkData).length > 0) {
			this.bookmarklist = JSON.parse(bookmarkData);
		} else {
			localStorage.setItem('bookmarkData', JSON.stringify(this.bookmarklist));
		}
		this.init();
		const vm = this;
		const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
		browserAPI.storage.local.get(['bookmarkData', 'bookmarks'], (result) => {
			// 处理单个书签数据（向后兼容）
			if (result.bookmarkData) {
				// 检查是否已有相同的 URL
				const isUrlExist = vm.bookmarklist.some((bookmarkGroup) =>
					bookmarkGroup.list.some((item) => item.url === result.bookmarkData.url),
				);

				// 先检查是否存在 id 为 0 的列表
				let defaultList = vm.bookmarklist.find((item) => item.id === 0);

				// 如果不存在，创建默认列表并添加到 bookmarklist
				if (!defaultList) {
					defaultList = {
						id: 0,
						name: '默认',
						list: [],
						sort: 1,
					};
					vm.bookmarklist.unshift(defaultList);
				}

				if (isUrlExist) {
					// 如果 URL 已存在，先从所有列表中移除该书签
					vm.bookmarklist.forEach((bookmarkGroup) => {
						bookmarkGroup.list = bookmarkGroup.list.filter((item) => item.url !== result.bookmarkData.url);
					});
				}

				// 添加书签数据
				vm.bookmarklist.find((item) => item.id === 0).list.unshift(result.bookmarkData);

				// 处理完后立即清除 storage 中的数据
				browserAPI.storage.local.remove('bookmarkData');
			}

			// 处理批量书签数据（新实现）
			if (result.bookmarks && Array.isArray(result.bookmarks) && result.bookmarks.length > 0) {
				// 确保有默认分类
				let defaultList = vm.bookmarklist.find((item) => item.id === 0);
				if (!defaultList) {
					defaultList = {
						id: 0,
						name: '默认',
						list: [],
						sort: 1,
					};
					vm.bookmarklist.unshift(defaultList);
				}

				// 获取默认分类的引用
				const defaultFolder = vm.bookmarklist.find((item) => item.id === 0);

				// 处理每个书签
				result.bookmarks.forEach((bookmark) => {
					// 检查是否已有相同的 URL
					const existingBookmarkGroup = vm.bookmarklist.find((bookmarkGroup) =>
						bookmarkGroup.list.some((item) => item.url === bookmark.url),
					);

					if (existingBookmarkGroup) {
						// 找到包含此 URL 的书签组和书签索引
						vm.bookmarklist.forEach((bookmarkGroup) => {
							const index = bookmarkGroup.list.findIndex((item) => item.url === bookmark.url);
							if (index !== -1) {
								// 更新现有书签
								bookmarkGroup.list[index] = { ...bookmark };
							}
						});
					} else {
						// 添加新书签到默认分类
						defaultFolder.list.unshift({ ...bookmark });
					}
				});

				// 已处理 bookmarks，从 storage 中移除
				browserAPI.storage.local.remove('bookmarks');
			}

			vm.tableData = vm.bookmarklist[0];
			vm.selectedItemId = 0;

			vm.initPostCategory();
			vm.initPostTags();
			vm.Loading();
			localStorage.setItem('bookmarkData', JSON.stringify(vm.bookmarklist));
		});

		this.initPostCategory();
		this.initPostTags();
		this.Loading();

		// 加载 WebDAV 配置
		const webdavConfig = localStorage.getItem('webdavConfig');
		if (webdavConfig) {
			this.webdavConfig = JSON.parse(webdavConfig);
			this.webdavConfig.password = atob(this.webdavConfig.password);
		}

		// 判断 close=1，立即删除当前页面
		// 获取 URLSearchParams 对象
		const closeParams = new URLSearchParams(window.location.search);

		if (closeParams.get('close') == 1) {
			window.close();
		}
	},
};
</script>
