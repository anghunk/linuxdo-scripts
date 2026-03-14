import './app.css';
import { createApp } from 'vue';
import App from './App.vue';

const linuxDoMatches = ['https://linux.do/*', 'https://*.linux.do/*'];

export default defineContentScript({
	matches: linuxDoMatches,
	cssInjectionMode: 'ui',

	async main(ctx) {
		if (window.location.pathname.includes('/raw/')) return;

		const ui = await createShadowRootUi(ctx, {
			name: 'linuxdo-scripts-ui',
			position: 'inline',
			anchor: 'body',
			onMount: (container) => {
				const app = createApp(App);
				app.mount(container);
			},
			onRemove: (app) => {
				app?.unmount();
			},
		});
		ui.mount();
	},
});
