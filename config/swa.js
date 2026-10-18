// Writes staticwebapp.config.json for Azure Static Web Apps after each build.
// Spec 05 adds trailingSlash and the generated legacy routes here.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function buildSwaConfig(outDir = '_site') {
  const config = {
    routes: [{ route: '/', redirect: '/notices/', statusCode: 302 }],
    responseOverrides: {
      404: { rewrite: '/404.html', statusCode: 404 },
    },
  };
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'staticwebapp.config.json'), `${JSON.stringify(config, null, 2)}\n`);
  return config;
}

export default function (eleventyConfig) {
  eleventyConfig.on('eleventy.after', async ({ directories }) => {
    await buildSwaConfig(directories?.output ?? '_site');
  });
}
