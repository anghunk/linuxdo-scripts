<template>
	<div class="item">
		<div class="tit">{{ sort }}. 自定义快捷回复（换行分隔）</div>
	</div>
	<textarea
		v-model="textarea"
		@input="handleChange"
		class="multiline-placeholder"
		placeholder="前排围观支持一下
感谢分享大佬厉害啊
有点厉害支持~~"
	></textarea>
</template>

<script>
import $ from 'jquery';
import settingsManager from '../../utilities/settingsManager.js';
export default {
	props: {
		value: {
			type: String,
			default: '',
		},
		sort: {
			type: Number,
			required: true,
		},
	},
	data() {
		return {
			textarea: this.value,
			initTimer: null,
			list: [],
			isDropdown: false,
		};
	},
	watch: {
		value(newValue) {
			this.textarea = newValue;
			// 当数据从 IndexedDB 加载后，需要启动定时器来插入按钮
			if (newValue && !this.initTimer) {
				this.initTimer = setInterval(() => {
					this.init();
				}, 1000);
			}
		},
	},
	methods: {
		handleChange() {
			this.$emit('update:value', this.textarea);
		},
		async init() {
			try {
				const settings = await settingsManager.getSettings();
				const quick = settings && settings.QuickReply ? settings.QuickReply : '';
				// 按钮使用已保存的配置，定时刷新不能覆盖面板中未保存的草稿。
				this.list = quick ? quick.split(/\r?\n/) : [];
				console.log('自定义快捷回复', this.isDropdown);
				this.isDropdown = !!(settings && settings.QuickReplyisDropdown);
			} catch (e) {
				return;
			}

			if (!this.list.length) return;

			if ($('.createreply').length < 1) {
				if (this.isDropdown) {
					$('.timeline-container .topic-timeline').append(
						`<div class="createreply" style="margin-top:6.4rem;"><select class="createreply-select"><option value="">选择快捷回复</option></select></div>`,
					);
					this.list
						.filter((item) => item && item.trim().length > 0)
						.forEach(function (item) {
							const $opt = $('<option></option>').text(item).val(item);
							$('.createreply-select').append($opt);
						});
					$('.createreply-select').on('change', function () {
						const text = $(this).val();
						if (!text) return;
						if ($('.timeline-footer-controls button.create').length != 0) {
							$('.timeline-footer-controls button.create')[0].click();
						}
						if ($('#topic-footer-buttons .topic-footer-main-buttons button.create').length != 0) {
							$('#topic-footer-buttons .topic-footer-main-buttons button.create')[0].click();
						}
						setTimeout(() => {
							let $textarea = $('.d-editor-textarea-wrapper textarea');
							$textarea.focus();
							for (let i = 0; i < String(text).length; i++) {
								let char = String(text)[i];
								$textarea.val($textarea.val() + char);
								let inputEvent = new Event('input', { bubbles: true, cancelable: true });
								$textarea[0].dispatchEvent(inputEvent);
								let keyEvent = new KeyboardEvent('keydown', {
									key: char,
									char: char,
									keyCode: char.charCodeAt(0),
									which: char.charCodeAt(0),
									bubbles: true,
								});
								$textarea[0].dispatchEvent(keyEvent);
							}
						}, 1000);
					});
					return;
				}
				$('.timeline-container .topic-timeline').append(`<div class="createreply" style="margin-top:6.4rem;"></div>`);

				this.list
					.filter((item) => item && item.trim().length > 0)
					.forEach(function (item) {
						var $li = $(
							'<button class="btn btn-default create reply-to-post no-text btn-icon" type="button"></button>',
						).text(item);
						$('.createreply').append($li);
					});

				$('.createreply button').click(function () {
					if ($('.timeline-footer-controls button.create').length != 0) {
						$('.timeline-footer-controls button.create')[0].click();
					}
					if ($('#topic-footer-buttons .topic-footer-main-buttons button.create').length != 0) {
						$('#topic-footer-buttons .topic-footer-main-buttons button.create')[0].click();
					}

					setTimeout(() => {
						let $textarea = $('.d-editor-textarea-wrapper textarea');
						let text = $(this).html();
						$textarea.focus();
						for (let i = 0; i < text.length; i++) {
							let char = text[i];
							$textarea.val($textarea.val() + char);
							let inputEvent = new Event('input', {
								bubbles: true,
								cancelable: true,
							});
							$textarea[0].dispatchEvent(inputEvent);
							let keyEvent = new KeyboardEvent('keydown', {
								key: char,
								char: char,
								keyCode: char.charCodeAt(0),
								which: char.charCodeAt(0),
								bubbles: true,
							});
							$textarea[0].dispatchEvent(keyEvent);
						}
					}, 1000);
				});
			}
		},
		clearTimer() {
			if (this.initTimer) {
				clearInterval(this.initTimer);
				this.initTimer = null;
			}
		},
	},
	created() {
		if (this.textarea) {
			this.initTimer = setInterval(() => {
				this.init();
			}, 1000);
		}
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
