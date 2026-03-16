<template>
  <input
    v-model="webdavConfig.serverUrl"
    placeholder="https://example.com/dav/"
  />
  <input v-model="webdavConfig.username" placeholder="用户名" />
  <input v-model="webdavConfig.password" placeholder="密码" />

  <div class="webdav-actions">
    <button @click="saveWebDAVConfig">保存配置</button>
  </div>

  <div style="padding: 10px 0">云端同步操作</div>
  <div class="webdav-sync-actions">
    <button type="primary" @click="exportToWebDAV" :loading="exporting">
      导出到 WebDAV
    </button>
    <button type="primary" @click="importFromWebDAV" :loading="importing">
      从 WebDAV 导入
    </button>
  </div>
  <hr />
  <div style="margin: 10px 0">手动导入导出数据：</div>
  <ManualBackup />
</template>

<script>
import ManualBackup from './ManualBackup.vue'
import settingsManager from '../../utilities/settingsManager.js'
// WebDAVClient 类定义
class WebDAVClient {
 
  constructor(serverUrl, username, password) {
    if (!serverUrl || typeof serverUrl !== 'string') {
      throw new Error('服务器地址不能为空')
    }
    this.serverUrl = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/'
    this.auth = 'Basic ' + btoa(username + ':' + password)
  }

  async request(method, path, data = null, headers = {}) {
    let browserAPI = (typeof browser !== 'undefined' ? browser : chrome);
    // 移除路径开头的斜杠，并编码路径中的特殊字符
    path = path.replace(/^\/+/, '')
    const url = this.serverUrl + path;

    // 合并 headers
    const requestHeaders = {
      Authorization: this.auth,
      ...headers,
    }

    try {
      const response = await browserAPI.runtime.sendMessage({
        type: 'webdav',
        method: method,
        url: url,
        headers: requestHeaders,
        data: data,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.status >= 200 && response.status < 300) {
        return response.data
      } else {
        throw new Error(`请求失败：${response.status} ${response.statusText}`)
      }
    } catch (error) {
      throw new Error('WebDAV请求失败: ' + error.message)
    }
  }

  async putFile(path, content) {
    return this.request('PUT', path, content, {
      'Content-Type': 'application/json;charset=UTF-8',
    })
  }

  async getFile(path) {
    return this.request('GET', path)
  }

  async exists(path) {
    try {
      await this.request('PROPFIND', path, null, {
        Depth: '0',
      })
      return true
    } catch (e) {
      if (e.message.includes('404')) {
        return false
      }
      throw e
    }
  }

  async createDirectory(path) {
    return this.request('MKCOL', path)
  }

  // 测试连接
  async testConnection() {
    try {
      await this.exists('/')
      return true
    } catch (e) {
      throw new Error('连接测试失败: ' + e.message)
    }
  }

  // 确保目录存在
  async ensureDirectory(path) {
    if (!path) return

    const exists = await this.exists(path)
    if (!exists) {
      await this.createDirectory(path)
    }
  }
}

export default {
  components: {
    ManualBackup,
  },
  data() {
    return {
      // webdav 同步
      WebdavDialog: false,
      webdavConfig: {
        serverUrl: '',
        username: '',
        password: '',
        folder: 'linuxdo-scripts-backup/', // 默认文件夹
      },
      importing: false,
      exporting: false,
    }
  },
  methods: {
    // 提示组件
    messageToast(message) {
      const messageElement = document.createElement('div')
      messageElement.className = 'messageToast-text'
      messageElement.innerText = message
      document.getElementById('messageToast').appendChild(messageElement)
      setTimeout(() => {
        messageElement.remove()
      }, 3000)
    },

    async exportToWebDAV() {
      try {
        this.exporting = true

        // 获取配置
        const config = this.getAndValidateConfig()
        const client = new WebDAVClient(
          config.serverUrl,
          config.username,
          atob(config.password)
        )

        // 确保目录存在
        await client.ensureDirectory(config.folder)

        // 从 IndexedDB 获取要备份的数据
        const data = await settingsManager.getSettings()
        if (!data) {
          throw new Error('没有找到需要备份的数据')
        }

        // 上传文件
        const filePath = config.folder + 'data.json'
        await client.putFile(filePath, JSON.stringify(data, null, 2))

        this.messageToast('数据导出成功')
      } catch (err) {
        console.error('导出失败：', err)
        this.messageToast(err.message)
      } finally {
        this.exporting = false
      }
    },

    async importFromWebDAV() {
      try {
        this.importing = true

        // 获取配置
        const config = this.getAndValidateConfig()
        const client = new WebDAVClient(
          config.serverUrl,
          config.username,
          atob(config.password)
        )

        // 检查并读取文件
        const filePath = config.folder + 'data.json'
        if (!(await client.exists(filePath))) {
          throw new Error('备份文件不存在')
        }

        const content = await client.getFile(filePath)

        try {
          // 验证并解析数据格式
          const data = JSON.parse(content)
          
          // 保存到 IndexedDB
          const success = await settingsManager.saveSettings(data)
          if (success) {
            this.messageToast('数据导入成功，即将刷新页面')
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          } else {
            throw new Error('保存到数据库失败')
          }
        } catch (e) {
          if (e.message === '保存到数据库失败') {
            throw e
          }
          throw new Error('备份文件格式错误')
        }
      } catch (err) {
        console.error('导入失败：', err)
        this.messageToast(err.message)
      } finally {
        this.importing = false
      }
    },
    // 配置验证辅助方法
    getAndValidateConfig() {
      const config = JSON.parse(localStorage.getItem('webdavConfig'))
      if (
        !config ||
        !config.serverUrl ||
        !config.username ||
        !config.password
      ) {
        throw new Error('请先完成 WebDAV 配置')
      }
      return config
    },
    async checkAndRequestPermission(url) {
      var browserAPI = typeof browser !== 'undefined' ? browser : chrome
      try {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error('URL 必须以 http://或 https://开头')
        }

        let origin
        try {
          const cleanUrl = url.replace(/\/$/, '')
          origin = new URL(cleanUrl).origin + '/*'
        } catch (e) {
          throw new Error('无效的 URL 格式')
        }

        try {
          const existingPermissions = await browserAPI.permissions.contains({
            origins: [origin],
          })

          if (!existingPermissions) {
            const granted = await browserAPI.permissions.request({
              origins: [origin],
            })

            if (!granted) {
              throw new Error('用户拒绝了权限请求')
            }
          }
        } catch (e) {
          console.error('权限请求错误：', e)
          throw new Error('权限请求失败，请确保 URL 正确且已授予权限')
        }

        return true
      } catch (error) {
        throw error
      }
    },

    // 保存配置
    async saveWebDAVConfig() {
      try {
        // 基本验证
        if (
          !this.webdavConfig.serverUrl ||
          !this.webdavConfig.username ||
          !this.webdavConfig.password
        ) {
          throw new Error('请填写完整的 WebDAV 配置信息')
        }

        // URL 格式验证
        if (!this.webdavConfig.serverUrl.startsWith('http')) {
          throw new Error('服务器地址必须以 http:// 或 https:// 开头')
        }

        // 创建客户端并测试连接
        const client = new WebDAVClient(
          this.webdavConfig.serverUrl,
          this.webdavConfig.username,
          this.webdavConfig.password
        )

        await client.testConnection()

        // 保存配置 (密码用 base64 编码)
        localStorage.setItem(
          'webdavConfig',
          JSON.stringify({
            ...this.webdavConfig,
            password: btoa(this.webdavConfig.password),
          })
        )

        this.messageToast('配置保存成功')
      } catch (err) {
        console.error('保存配置失败：', err)
        this.messageToast(err.message)
      }
    },
  },
  created() {
    // 加载 WebDAV 配置
    const webdavConfig = localStorage.getItem('webdavConfig')
    if (webdavConfig) {
      this.webdavConfig = JSON.parse(webdavConfig)
      this.webdavConfig.password = atob(this.webdavConfig.password)
    }
  },
}
</script>

<style scoped>
input {
  margin: 6px 0 !important;
}
</style>