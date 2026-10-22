<template>
	<div>
		<div class="item">
			<div class="tit">{{ sort }}. 列表快速添加屏蔽词（标题后显示「屏蔽词」按钮，选中的词加入关键词屏蔽）</div>
			<input type="checkbox" :checked="modelValue.enable" @change="update({ enable: $event.target.checked })" />
		</div>
		<template v-if="modelValue.enable">
			<div class="item sub">
				<div class="tit">
					使用 TypeSafe AI 推荐屏蔽词
					<a href="https://console.typesafe.ai/keys" target="_blank" style="color: #e00; margin-left: 10px"
						>&lt;获取 API Key&gt;</a
					>
				</div>
				<input type="checkbox" :checked="modelValue.aiEnable" @change="update({ aiEnable: $event.target.checked })" />
			</div>
			<div v-if="modelValue.aiEnable" class="ai-config">
				<div class="inner">
					<label>API Key</label>
					<input
						type="password"
						:value="modelValue.apikey"
						placeholder="TypeSafe API Key"
						@input="update({ apikey: $event.target.value.trim() })"
					/>
				</div>
				<div class="inner">
					<label>模型</label>
					<input
						type="text"
						:value="modelValue.model"
						placeholder="jev-latest"
						@input="update({ model: $event.target.value.trim() })"
					/>
				</div>
			</div>
		</template>
	</div>
</template>

<script>
export default {
	props: ['modelValue', 'sort'],
	emits: ['update:modelValue'],
	methods: {
		update(patch) {
			this.$emit('update:modelValue', { ...this.modelValue, ...patch });
		},
	},
};
</script>

<style lang="less" scoped>
.item.sub {
	border-top: none !important;
	padding-top: 0 !important;
	padding-left: 1em !important;
}
.ai-config {
	padding: 0 0 10px 1em;
}
</style>
