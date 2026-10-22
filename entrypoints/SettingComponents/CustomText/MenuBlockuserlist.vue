<template>
  <div class="item">
    <div class="tit">{{ sort }}. 屏蔽指定用户（使用英文，分隔）</div>
  </div>
  <textarea v-model="textarea" @input="handleChange" placeholder="user1,user2,user3">
  </textarea>
</template>

<script>
import $ from "jquery";
import { isUserPage } from "../../utilities/url";
export default {
  props: {
    value: {
      type: String,
      default: "",
    },
    sort: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      textarea: this.value,
      blockTimer: null,
      list: [],
    };
  },
  watch: {
    value(newValue) {
      this.textarea = newValue;
      // 当数据从 IndexedDB 加载完成后，重新初始化屏蔽功能
      if (newValue && !this.blockTimer) {
        this.startPolling();
      }
    },
    textarea(newValue) {
      // 当用户手动修改内容时，如果内容变为空，则停止轮询
      if (!newValue && this.blockTimer) {
        this.stopPolling();
      }
    },
  },
  methods: {
    handleChange() {
      this.$emit("update:value", this.textarea);
    },
    init() {
      this.list = this.textarea.split(",") || [];
      var self = this; // 保存外部上下文
      // 用户主页列的是该用户自己的话题，不屏蔽
      if (!isUserPage()) {
        $(".topic-list .topic-list-data.posters>a:nth-child(1)")
          .filter((index, element) => {
            var user = $(element).attr("data-user-card");
            return self.list.indexOf(user) !== -1;
          })
          .parents("tr.topic-list-item")
          .remove();
      }

      $(".topic-post .full-name a")
        .filter((index, element) => {
          var user = $(element).attr("data-user-card");
          return self.list.indexOf(user) !== -1;
        })
        .parents(".topic-post")
        .remove();
    },
    startPolling() {
      if (this.blockTimer || !this.textarea) return;
      
      // 不按行数变化判断：从用户主页（不屏蔽）切回首页时，两边列表行数可能相同，会漏掉屏蔽
      this.blockTimer = setInterval(() => {
        this.init();
      }, 1000);
    },
    stopPolling() {
      if (this.blockTimer) {
        clearInterval(this.blockTimer);
        this.blockTimer = null;
      }
    },
    clearTimer() {
      // 保留旧方法名以保持兼容性
      this.stopPolling();
    }
  },
  mounted() {
    // 使用 mounted 而不是 created，确保 DOM 已就绪
    // 同时给父组件一些时间从 IndexedDB 加载数据
    this.$nextTick(() => {
      if (this.textarea) {
        this.startPolling();
      }
    });
  },
  beforeUnmount() {
    this.clearTimer();
  },
  beforeDestroy() {
    this.clearTimer();
  },
};
</script>

<style lang="less" scoped>
.item {
  border: none !important;
}
</style>
