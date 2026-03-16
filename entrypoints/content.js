import './app.css';
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
	matches: ['https://linux.do/*', 'https://idcflare.com/*'],
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
