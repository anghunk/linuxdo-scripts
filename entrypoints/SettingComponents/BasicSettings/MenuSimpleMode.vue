<template>
  <div class="item">
    <div class="tit">{{ sort }}. 开启论坛简洁模式</div>
    <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />
  </div>
</template>

<script>
import $ from "jquery";
export default {
  props: ["modelValue", "sort"],
  emits: ["update:modelValue"],
  created() {
    if (this.modelValue) {
      $('head').append(`<style>
.topic-post .avatar{width:30px!important;height:30px!important}
.topic-avatar .avatar-flair.rounded{display:none}
.topic-avatar{width:auto!important}
.names .user-title{display:none}
.topic-meta-data .user-status-message-wrap{display:none}
#topic-title h1 a{font-weight:500;font-size:22px}
.more-topics__container{display:none}
#topic-footer-buttons .topic-footer-main-buttons__actions,.global-notice,.topic-list .views,.topic-notifications-button,.topic-map__contents,.topic-map__additional-contents{display:none!important}
.names>span a,.topic-body .reply-to-tab{font-size:14px;color:silver!important;font-weight:400}
.d-header-wrap{opacity:.2;transition:all .15s linear}
.d-header-wrap:hover{opacity:1}
.sidebar-wrapper{opacity:.3;transition:all .15s linear}
.sidebar-wrapper:hover{opacity:1}
.category-heading{display:flex;align-items:center}
.category-logo.aspect-image{width:50px!important;margin-right:10px!important}
.category-heading p{font-size:20px!important}
.category-boxes .description{display:none!important}
.category-boxes h3{font-size:18px!important;font-weight:400;display:flex;align-items:center;justify-content:center}
.category-boxes h3 .ember-view{margin-right:10px}
.topic-post .topic-avatar .post-avatar::after{width:30px!important;height:30px!important}
      </style>`)
    }
  },
};
</script>
