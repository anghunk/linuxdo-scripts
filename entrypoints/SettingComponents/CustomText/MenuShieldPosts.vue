<template>
  <div class="item" style="border: none">
    <div class="tit">
      {{ sort }}. 屏蔽指定天数前的帖子
      <input type="text" v-model="localChecked.days" placeholder="默认天数 5" />
    </div>
    <input type="checkbox" v-model="localChecked.value1" @change="handleChange" />
  </div>
  <div>
    <p>针对分类：留空对全部分类生效，多个分类用英文逗号【,】进行分隔</p>
    <textarea v-model="localChecked.cate" placeholder="搞七捻三"></textarea>
  </div>
</template>

<script>
import $ from "jquery";
import { isUserPage } from "../../utilities/url";
export default {
  props: {
    value: {
      type: Object,
      default: {
        value1: false,
        cate: "搞七捻三",
        days: "5",
      },
    },
    sort: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      localChecked: this.value,
      shieldPostsIntervalId: null, // 添加变量存储定时器 ID
    };
  },
  watch: {
    value(newValue) {
      this.localChecked = newValue;
      // 当数据从 IndexedDB 加载完成后，重新初始化屏蔽功能
      if (newValue && newValue.value1 && !this.shieldPostsIntervalId) {
        this.startPolling();
      } else if (newValue && !newValue.value1 && this.shieldPostsIntervalId) {
        this.stopPolling();
      }
    },
    "localChecked.value1"(newValue) {
      // 监听开关状态变化
      if (newValue && !this.shieldPostsIntervalId) {
        this.startPolling();
      } else if (!newValue && this.shieldPostsIntervalId) {
        this.stopPolling();
      }
    },
  },
  methods: {
    handleChange() {
      this.$emit("update:value", this.localChecked);
    },
    // 过滤时间格式
    convertToTimestamp(dateStr) {
      const cleanedDateStr = dateStr.replace(/\s+/g, ""); // 去掉所有空格
      const datePattern = /(\d{4})年(\d{1,2})月(\d{1,2})日(\d{2}):(\d{2})/;
      const dateMatch = cleanedDateStr.match(datePattern);

      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const day = parseInt(dateMatch[3], 10);
        const hours = parseInt(dateMatch[4], 10);
        const minutes = parseInt(dateMatch[5], 10);

        const date = new Date(year, month, day, hours, minutes);
        return date.getTime();
      }
      return null;
    },
    // 屏蔽指定分类、指定时间
    GetTimestamp() {
      // 用户主页列的是该用户自己的话题，不屏蔽
      if (
        !isUserPage() &&
        !$(".nav-pills > li.nav-item_posted").hasClass("active") &&
        !$(".nav-pills > li.nav-item_bookmarks").hasClass("active")
      ) {
        if (this.localChecked.cate == "") {
          $(".topic-list .age").each((index, element) => {
            const str = $(element).attr("title");
            const match = str && str.match(/创建日期：([\s\S]*?)最新：/);
            if (match && match[1]) {
              const creationDate = match[1].trim();
              const timestamp = this.convertToTimestamp(creationDate);
              const days = Number(this.localChecked.days) * 86400000;
              if (Date.now() - timestamp > days) {
                $(element).parents("tr.topic-list-item").remove();
              }
            }
          });
        } else {
          const cateArray = this.localChecked.cate.split(",").map((item) => item.trim());
          $(".badge-category__wrapper .badge-category__name").each((index, element) => {
            let htmlContent = $(element).html();
            htmlContent = htmlContent.replace(/,\s*Lv[1-3]/g, "");
            if (cateArray.includes(htmlContent.trim())) {
              $(element)
                .parents("tr.topic-list-item")
                .find(".age")
                .each((index, element) => {
                  const str = $(element).attr("title");
                  const match = str && str.match(/创建日期：([\s\S]*?)最新：/);
                  if (match && match[1]) {
                    const creationDate = match[1].trim();
                    const timestamp = this.convertToTimestamp(creationDate);
                    const days = Number(this.localChecked.days) * 86400000;
                    if (Date.now() - timestamp > days) {
                      $(element).parents("tr.topic-list-item").remove();
                    }
                  }
                });
            }
          });
        }
      }
    },
    startPolling() {
      if (this.shieldPostsIntervalId || !this.localChecked.value1) return;

      // 不按行数变化判断：从用户主页（不屏蔽）切回首页时，两边列表行数可能相同，会漏掉屏蔽
      this.shieldPostsIntervalId = setInterval(() => {
        this.GetTimestamp();
      }, 1000);
    },
    stopPolling() {
      if (this.shieldPostsIntervalId) {
        clearInterval(this.shieldPostsIntervalId);
        this.shieldPostsIntervalId = null;
      }
    },
  },
  mounted() {
    // 使用 mounted 而不是 created，确保 DOM 已就绪
    // 同时给父组件一些时间从 IndexedDB 加载数据
    this.$nextTick(() => {
      if (this.localChecked.value1) {
        this.startPolling();
      }
    });
  },
  beforeUnmount() {
    // 清除定时器 (Vue 3)
    this.stopPolling();
  },
  // Vue 2 兼容性
  beforeDestroy() {
    // 清除定时器 (Vue 2)
    this.stopPolling();
  },
};
</script>

<style lang="less" scoped>
input[type="text"] {
  width: 100px !important;
  outline: none;
  height: 24px;
  border: 1px solid #b6b6b6;
  border-radius: 4px;
  margin-left: 10px;
  padding: 0 10px;
  box-sizing: border-box;
}
</style>
