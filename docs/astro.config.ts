import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import starlightImageZoom from 'starlight-image-zoom';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'CDK Express Pipeline',
			description: 'CDK pipelines provides constructs for Waves, Stages using only native CDK stack dependencies',
			defaultLocale: 'en',
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Introduction', link: '/guides/introduction/' },
						{ label: 'Installation', link: '/guides/installation/' },
						{ label: 'Usage', link: '/guides/usage/' },
						{ label: 'Usage Legacy', link: '/guides/usage-legacy/' },
						{ label: 'Options', link: '/guides/options/' },
						{ label: 'Deployment Order', link: '/guides/deployment-order/' },
						{ label: 'Stack IDs, Names & Selection', link: '/guides/selective-deployment/' },
					],
				},
				{
					label: 'Build Systems',
					items: [
						{ label: 'Local', link: '/build-systems/local/' },
						{ label: 'GitHub Actions', link: '/build-systems/github-actions/' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'API Reference', link: '/reference/api/' },
						{ label: 'CDK CLI Commands', link: '/reference/cdk-cli-commands/' },
						{ label: 'Resources', link: '/reference/resources/' },
						{ label: 'FAQ', link: '/reference/faq/' },
						{ label: 'Contributing', link: '/reference/contributing/' },
					],
				},
				{
					label: 'Tutorials',
					items: [
						{ label: 'Getting Started', link: '/tutorials/getting-started/' },
					]
				},
				{
					label: 'Migrations',
					items: [
						{ label: "From CDK Pipelines", link: '/migrations/migrate-from-cdk-pipelines-to-cdk-express-pipeline/' },
					]
				}
			],
			social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/rehanvdm/cdk-express-pipeline',
        },
      ],
			editLink: {
				baseUrl: 'https://github.com/rehanvdm/cdk-express-pipeline/edit/main/docs/',
			},
			plugins: [starlightImageZoom()],
			tableOfContents: {
				maxHeadingLevel: 4
			}
		}),
	],
	site: 'https://rehanvdm.github.io',
	base: '/cdk-express-pipeline',

	markdown: {
		rehypePlugins: [[rehypeMermaid, { strategy: "img-png", mermaidConfig: { theme: 'neutral' } }]], // CSS styles do not apply, have to inline
	},
});
