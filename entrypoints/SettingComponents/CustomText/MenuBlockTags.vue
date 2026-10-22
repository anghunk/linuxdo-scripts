<template>
  <div class="item">
    <div class="tit">
      {{ sort }}. 标签屏蔽功能（使用英文，分隔）屏蔽指定标签
    </div>
  </div>
  <textarea v-model="textarea" @input="handleChange"> </textarea>
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
      pollingInterval: null, // 轮询定时器
    };
  },
  watch: {
    value(newValue) {
      this.textarea = newValue;
      // 当数据从 IndexedDB 加载完成后，重新初始化屏蔽功能
      if (newValue && !this.pollingInterval) {
        this.startPolling();
      }
    },
    textarea(newValue) {
      // 当用户手动修改内容时，如果内容变为空，则停止轮询
      if (!newValue && this.pollingInterval) {
        this.stopPolling();
      }
    },
  },
  methods: {
    handleChange() {
      this.$emit("update:value", this.textarea);
    },
    init() {
      // 用户主页列的是该用户自己的话题，不屏蔽
      if (!this.textarea || isUserPage()) return;

      // 将用户输入的关键字分割为数组，并去除空格和空值
      const keywords = this.textarea
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
      if (keywords.length === 0) return;

      // 安全检查 jQuery 的使用，防止元素不可用时出错
      try {
        // 检查话题标签
        $(".topic-list-item .discourse-tags a")
          .filter((index, element) => {
            const text = $(element).text();
            return keywords.some((keyword) => text.includes(keyword));
          })
          .parents("tr.topic-list-item")
          .remove();
      } catch (error) {
        console.error("init 方法出错：", error);
      }
    },
    startPolling() {
      if (this.pollingInterval || !this.textarea) return;

      // 不按行数变化判断：从用户主页（不屏蔽）切回首页时，两边列表行数可能相同，会漏掉屏蔽
      this.pollingInterval = setInterval(() => {
        try {
          this.init();
        } catch (error) {
          console.error("轮询逻辑出错：", error);
        }
      }, 1000);
    },
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },
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
  beforeDestroy() {
    // 在组件销毁前清除定时器，防止内存泄漏
    this.stopPolling();
  },
};
</script>

<style lang="less" scoped>
.item {
  border: none !important;
}
</style>
