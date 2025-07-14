import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'CDK Express Pipeline',
      description: 'CDK pipelines provides constructs for Waves, Stages using only native CDK stack dependencies',
      defaultLocale: 'en',
      locales: {
        en: {
          label: 'English',
        },
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Introduction', link: '/guides/introduction/' },
            { label: 'Installation', link: '/guides/installation/' },
            { label: 'Usage', link: '/guides/usage/' },
            { label: 'Deployment Order', link: '/guides/deployment-order/' },
            { label: 'Selective Deployment', link: '/guides/selective-deployment/' },
            { label: 'GitHub CI Workflow Generation', link: '/guides/github-ci-workflow-generation/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API Reference', link: '/reference/api/' },
            { label: 'FAQ', link: '/reference/faq/' },
            { label: 'Contributing', link: '/reference/contributing/' },
          ],
        },
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
    }),
  ],
  site: 'https://rehanvdm.github.io',
  base: '/cdk-express-pipeline',
}); 