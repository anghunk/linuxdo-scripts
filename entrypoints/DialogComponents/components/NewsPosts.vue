<template>
  <ul class="list" v-if="this.list.length > 0">
    <li v-for="item in list" :key="item.id" class="news-item">
      <div class="news-content">
        <button
          class="preview-btn"
          @click="previewPost(item.id)"
          title="设为已读"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6"/>
          </svg>
        </button>
        <a
          :href="'https://linux.do/t/topic/' + item.id"
          @click="handleLinkClick($event, item.id)"
          class="news-link"
          :ref="`link-${item.id}`"
          @mouseenter="showTooltip($event, item.title)"
          @mouseleave="hideTooltip"
        >
          {{ item.title }}
        </a>
        <em>{{ item.highest_post_number }}</em>
      </div>
    </li>
  </ul>
  <div class="nodata" v-else>暂无最新话题</div>

  <!-- 自定义 tooltip -->
  <div
    v-if="tooltip.show"
    class="custom-tooltip"
    :style="tooltip.style"
  >
    {{ tooltip.text }}
  </div>
</template>

<script>
export default {
  props: ["list"],
  emits: ["remove-item"],
  data() {
    return {
      tooltip: {
        show: false,
        text: '',
        style: {}
      }
    }
  },
  methods: {
    async handleLinkClick(event, itemId) {
      // 阻止默认的链接行为
      event.preventDefault();

      // 构建目标URL
      const targetUrl = `https://linux.do/t/topic/${itemId}`;

      try {
        const browserAPI = typeof browser !== "undefined" ? browser : chrome;

        // 查询当前活动的标签页
        const tabs = await new Promise((resolve) => {
          browserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
        });

        if (tabs.length > 0) {
          const currentTab = tabs[0];

          // 检查当前活动标签页是否为 linux.do
          if (currentTab.url && currentTab.url.includes('linux.do')) {
            // 如果当前标签页是 linux.do，直接在当前标签页跳转
            browserAPI.tabs.update(currentTab.id, { url: targetUrl });
          } else {
            // 如果不是 linux.do，创建新标签页
            browserAPI.tabs.create({ url: targetUrl });
          }
        } else {
          // 如果无法获取标签页信息，默认创建新标签页
          browserAPI.tabs.create({ url: targetUrl });
        }
      } catch (error) {
        console.error('处理链接跳转失败：', error);
        // 出错时回退到新标签页打开
        window.open(targetUrl, '_blank');
      }

      // 向父组件发送移除事件
      this.$emit("remove-item", itemId);
    },

    previewPost(itemId) {
      // 后台预览帖子，保持用户登录状态
      console.log('开始后台预览帖子：', itemId);
      this.loadPostInBackground(`https://linux.do/t/topic/${itemId}`);
      // 预览后也移除这条目
      this.$emit("remove-item", itemId);
    },

    loadPostInBackground(url) {
      // 创建隐藏的 iframe 来加载页面，保持用户登录状态
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.src = url;

      // 监听加载完成
      iframe.onload = () => {
        console.log('后台预览完成：', url);
        // 延迟移除 iframe，确保页面完全加载
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      };

      // 错误处理
      iframe.onerror = () => {
        console.error('后台预览失败：', url);
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      };

      // 添加到页面
      document.body.appendChild(iframe);
    },

    // 检测文字是否被截断
    isTextTruncated(element) {
      return element.scrollWidth > element.clientWidth;
    },

    // 显示 tooltip
    showTooltip(event, text) {
      const linkElement = event.target;

      // 只有当文字被截断时才显示 tooltip
      if (!this.isTextTruncated(linkElement)) {
        return;
      }

      const rect = linkElement.getBoundingClientRect();

      this.tooltip = {
        show: true,
        text: text,
        style: {
          position: 'fixed',
          top: (rect.top - 35) + 'px',
          left: rect.left + 'px',
          maxWidth: '300px',
          zIndex: 9999
        }
      };
    },

    // 隐藏 tooltip
    hideTooltip() {
      this.tooltip.show = false;
    }
  }
};
</script>

<style scoped>
.news-item {
  margin-bottom: 4px;
}

.news-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  min-height: 20px; /* 固定最小行高 */
  width: 100%;
  overflow: hidden; /* 防止内容溢出 */
}

.preview-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px 6px; /* 增加垂直 padding 来扩大点击区域 */
  margin: -6px -2px; /* 负 margin 抵消 padding 对布局的影响 */
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  min-width: 24px; /* 确保最小点击宽度 */
}

.preview-btn:hover {
  background-color: #f0f0f0;
  color: #1890ff;
}

.preview-btn svg {
  width: 14px;
  height: 14px;
}

.news-link {
  flex: 1;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2; /* 控制文字行高 */
  min-width: 0; /* 允许 flex 项目收缩到内容宽度以下 */
}

.news-link:hover {
  color: #1890ff;
}

.news-content em {
  font-style: normal;
  color: #999;
  font-size: 12px;
  flex-shrink: 0;
  line-height: 1.2; /* 控制数字行高 */
}

.custom-tooltip {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
