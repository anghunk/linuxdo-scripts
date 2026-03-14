<template>
  <p>欢迎使用 Linuxdo Scripts 扩展！</p>
  <p>
    鼠标移动到浏览器最左侧后点击设置按钮，
    <a href="https://linuxdo-scripts.zishu.me/" target="_blank"> 使用教程！ </a>
  </p>

  <a-divider />

  <a-space>
    <a-button type="primary" @click="openBookmark">收藏夹</a-button>
    <a-button type="primary" @click="openShare">分享话题图片</a-button>
    <a-button type="outline" @click="goGithub">Github</a-button>
  </a-space>

  <a-divider />

  <div class="item">
    <div class="label">1.开启该设置时，会“隐藏”论坛左侧触发的设置按钮。</div>
    <a-switch v-model="isShow" @change="ShowSettingConfig" />
  </div>
  <div style="height: 10px"></div>
  <div class="item">
    <div class="label">2.【最新】列表中是否将“已读”按钮放置在最前方。</div>
    <a-switch v-model="isReadonlyBefore" @change="ReadonlyBefore" />
  </div>

  <a-divider />

  <div class="item">
    <div class="label">
      点击扩展图标时打开
      <Question @click="showCompatibilityReminder" />
    </div>
    <a-radio-group v-model="clickTarget" type="button" @change="onClickTargetChange">
      <a-radio value="sidepanel">侧边栏</a-radio>
      <a-radio value="popup">弹窗</a-radio>
    </a-radio-group>
  </div>
  <!-- 兼容性提示 -->
  <div class="CompatibilityReminder" v-show="CompatibilityReminder">
    <p>
      兼容性提示：如果你使用 Arc
      等不支持浏览器侧边的第三方软件，可以直接引入下方链接作为侧边。
    </p>
    <a href="javascript:void(0)" target="_blank" @click="gosidepanel">点击显示侧边链接</a>
  </div>

  <a-divider />

  <div class="site-access">
    <div class="site-access-title">有权访问的网站</div>
    <p class="site-access-desc">
      默认仅允许访问 linux.do 及其子域名。AI API、WebDAV 等外部服务，需要在这里单独授权对应站点。
    </p>

    <div class="site-access-group">
      <div class="group-title">默认可访问网站</div>
      <div class="site-list tags">
        <span v-for="site in defaultSites" :key="site" class="site-tag fixed">{{ formatSiteLabel(site) }}</span>
      </div>
    </div>

    <div class="site-access-group">
      <div class="group-title">已额外授权的网站</div>
      <div v-if="optionalSites.length > 0" class="site-list rows">
        <div class="site-row" v-for="site in optionalSites" :key="site">
          <span class="site-origin">{{ formatSiteLabel(site) }}</span>
          <a-button size="small" status="danger" @click="removeSiteAccess(site)">移除</a-button>
        </div>
      </div>
      <div v-else class="site-empty">暂无额外授权站点</div>
    </div>

    <div class="site-access-form">
      <input
        v-model.trim="siteAccessInput"
        type="text"
        placeholder="https://api.example.com/v1/chat/completions"
      />
      <a-space>
        <a-button type="primary" :loading="siteAccessLoading" @click="requestSiteAccess">授权站点</a-button>
        <a-button :loading="siteAccessRefreshing" @click="loadAuthorizedSites">刷新</a-button>
      </a-space>
    </div>

    <div class="site-access-tip">
      撤销站点权限后，依赖该站点的 AI 或 WebDAV 功能会立即失效，直到重新授权。
    </div>
  </div>
</template>

<script>
import Question from "./SVG/Question.vue";
import { requestSitePermission } from "../../utilities/sitePermissions.js";

export default {
  components: {
    Question,
  },
  data() {
    return {
      isShow: false,
      isReadonlyBefore: false,
      clickTarget: "sidepanel",
      activeKey: ["1"],
      CompatibilityReminder: false,
      defaultSites: ["https://linux.do/*", "https://*.linux.do/*"],
      optionalSites: [],
      siteAccessInput: "",
      siteAccessLoading: false,
      siteAccessRefreshing: false,
    };
  },
  methods: {
    // 与 background 通信，读取或移除已授权站点
    sendRuntimeMessage(action, payload = {}) {
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      return new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage({ action, ...payload }, (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
    },
    formatSiteLabel(site) {
      return site.replace(/^https:\/\//, "");
    },
    // 获取当前已授权的默认站点和额外站点
    async loadAuthorizedSites() {
      this.siteAccessRefreshing = true;
      try {
        const response = await this.sendRuntimeMessage("permissions_get_sites");
        if (!response?.success) {
          throw new Error(response?.error || "获取已授权站点失败");
        }
        this.defaultSites = response.defaultSites || this.defaultSites;
        this.optionalSites = response.optionalSites || [];
      } catch (error) {
        this.$message.error(error.message || "获取已授权站点失败");
      } finally {
        this.siteAccessRefreshing = false;
      }
    },
    // 必须在用户点击事件里直接申请权限，避免 Chrome MV3 丢失 user gesture
    async requestSiteAccess() {
      if (!this.siteAccessInput) {
        this.$message.warning("请输入需要授权的站点 URL");
        return;
      }

      this.siteAccessLoading = true;
      try {
        const response = await requestSitePermission(this.siteAccessInput);
        if (!response?.success) {
          throw new Error(response?.error || "站点授权失败");
        }

        this.siteAccessInput = "";
        this.$message.success(response.origin ? `已授权 ${response.origin}` : "已授权默认站点");
        await this.loadAuthorizedSites();
      } catch (error) {
        this.$message.error(error.message || "站点授权失败");
      } finally {
        this.siteAccessLoading = false;
      }
    },
    // 移除某个额外授权站点
    async removeSiteAccess(site) {
      if (!window.confirm(`确定移除 ${this.formatSiteLabel(site)} 的访问权限吗？`)) {
        return;
      }

      try {
        const response = await this.sendRuntimeMessage("permissions_remove_site", {
          origin: site,
        });
        if (!response?.success) {
          throw new Error(response?.error || "移除站点权限失败");
        }
        this.$message.success(`已移除 ${response.origin}`);
        await this.loadAuthorizedSites();
      } catch (error) {
        this.$message.error(error.message || "移除站点权限失败");
      }
    },
    gosidepanel() {
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      browserAPI.tabs.create({
        url: browserAPI.runtime.getURL("sidepanel.html"),
      });
    },
    // 收藏夹
    openBookmark() {
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      browserAPI.runtime.sendMessage({ action: "open_bookmark_page" });
    },
    // 分享话题
    openShare() {
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      browserAPI.tabs.create({
        url: browserAPI.runtime.getURL("share.html"),
      });
    },
    // 设置
    goSetting() {
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      browserAPI.tabs.create({
        url: browserAPI.runtime.getURL("options.html"),
      });
    },
    goGithub() {
      window.open("https://github.com/anghunk/linuxdo-scripts", "_blank");
    },
    // 是否隐藏设置按钮
    ShowSettingConfig() {
      localStorage.setItem("isShowSettingConfig", this.isShow);
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      const data = { isShowSettingConfig: this.isShow };
      browserAPI.storage.local.set({ transferData: data }, () => {
        // 获取当前标签页并发送消息
        browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          browserAPI.tabs.sendMessage(tabs[0].id, { action: "getData" });
        });

        this.$message.success("切换成功！");
      });
    },
    onClickTargetChange() {
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      browserAPI.storage?.local.set({ clickOpenTarget: this.clickTarget }, () => {
        this.$message.success("已更新点击打开方式！");
      });
    },
    // 切换兼容性提示显示
    showCompatibilityReminder() {
      this.CompatibilityReminder = !this.CompatibilityReminder;
    },
    // 将已读按钮放在最前方
    ReadonlyBefore() {
      try {
        localStorage.setItem("isReadonlyBefore", this.isReadonlyBefore);

        // 触发自定义存储事件，通知其他组件
        if (window && typeof window.dispatchEvent === "function") {
          window.dispatchEvent(
            new CustomEvent("readonlyBeforeChanged", {
              detail: { isReadonlyBefore: this.isReadonlyBefore },
            })
          );
        }

        this.$message.success("设置已保存！");
      } catch (error) {
        console.error("保存设置失败：", error);
        this.$message.error("设置保存失败，请重试！");
      }
    },
  },
  async created() {
    const isShowSettingConfig = localStorage.getItem("isShowSettingConfig");
    const isReadonlyBefore = localStorage.getItem("isReadonlyBefore");

    if (JSON.parse(isShowSettingConfig)) {
      this.isShow = JSON.parse(isShowSettingConfig);
    }

    if (isReadonlyBefore !== null) {
      this.isReadonlyBefore = JSON.parse(isReadonlyBefore);
    }

    const browserAPI = typeof browser !== "undefined" ? browser : chrome;
    browserAPI.storage?.local.get(["clickOpenTarget"], (res) => {
      if (res && res.clickOpenTarget) this.clickTarget = res.clickOpenTarget;
    });

    await this.loadAuthorizedSites();
  },
};
</script>

<style lang="less" scoped>
.el-button {
  margin-top: 10px;
  margin-bottom: 10px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .label {
    font-size: 14px;
    margin-right: 10px;
    display: inline-flex;
    align-items: center;
    opacity: 0.8;

    svg {
      width: 20px;
      margin-left: 5px;
      transition: all 0.1s linear;
      cursor: pointer;

      &:hover {
        color: #333;
      }
    }
  }
}

.CompatibilityReminder,
.site-access {
  color: #333;
  font-size: 13px;
  margin-top: 10px;
  background: #fffbe6;
  border-radius: 5px;
  padding: 10px;

  a {
    color: #1890ff;
    text-decoration: underline;
  }
}

.site-access {
  background: #f7f8fa;

  .site-access-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .site-access-desc,
  .site-access-tip {
    line-height: 1.6;
    opacity: 0.8;
  }

  .site-access-group + .site-access-group,
  .site-access-form,
  .site-access-tip {
    margin-top: 12px;
  }

  .group-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .site-list.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .site-tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: #e8f3ff;
    color: #165dff;
    word-break: break-all;

    &.fixed {
      background: #e8ffea;
      color: #00a854;
    }
  }

  .site-list.rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .site-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    background: #fff;
  }

  .site-origin {
    word-break: break-all;
    flex: 1;
  }

  .site-empty {
    opacity: 0.7;
  }

  .site-access-form {
    display: flex;
    flex-direction: column;
    gap: 8px;

    input {
      width: 100%;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      padding: 8px 10px;
      box-sizing: border-box;
    }
  }
}
</style>
