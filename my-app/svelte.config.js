import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Deployed on Vercel. The function runtime follows the Node.js version set in the
		// Vercel project (20.x, 22.x or 24.x).
		// See https://svelte.dev/docs/kit/adapter-vercel for options.
		adapter: adapter(),
		alias:{
			"@/*": "./src/lib/*",

		},
	},
};

export default config;
