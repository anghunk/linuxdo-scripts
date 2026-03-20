<template>
  <div class="item">
    <div class="tit">{{ sort }}. 是否新标签页打开话题</div>
    <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />
  </div>
</template>

<script>
export default {
  props: ["modelValue", "sort"],
  emits: ["update:modelValue"],
  data() {
    return {
      handleLinkClick: null,
    };
  },
  watch: {
    modelValue(newVal) {
      if (newVal) {
        this.bindClickHandler();
      } else {
        this.unbindClickHandler();
      }
    },
  },
  methods: {
    bindClickHandler() {
      if (this.handleLinkClick) return;

      const linkSelector = [
        ".topic-list-item a.raw-topic-link",
        ".topic-list-item .link-top-line a.raw-link",
        ".topic-list-item a.topic-excerpt",
        ".search-results a.search-link",
        ".search-result-topic a.search-link",
      ].join(", ");

      this.handleLinkClick = (e) => {
        if (!(e.target instanceof Element) || e.defaultPrevented || e.button !== 0) {
          return;
        }

        const link = e.target.closest(linkSelector);

        if (!link?.href) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        window.open(link.href, "_blank", "noopener,noreferrer");
      };

      document.body.addEventListener("click", this.handleLinkClick, true);
    },
    unbindClickHandler() {
      if (!this.handleLinkClick) return;

      document.body.removeEventListener("click", this.handleLinkClick, true);
      this.handleLinkClick = null;
    },
  },
  created() {
    if (this.modelValue) {
      this.bindClickHandler();
    }
  },
  beforeUnmount() {
    this.unbindClickHandler();
  },
};
</script>
