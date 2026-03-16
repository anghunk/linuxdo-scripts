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
</template>

<script>
import Question from "./SVG/Question.vue";

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
    };
  },
  methods: {
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
  created() {
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

.CompatibilityReminder {
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
</style>
