import { mkdir, writeFile } from 'node:fs/promises';
import { api, topLangs } from '@stats-organization/github-readme-stats-core';

/** 复用 GitHub Stats Extended 官方核心；两张卡片均成功后才写入图片。 */
async function main() {
  if (!process.env.PAT_1) {
    throw new Error('缺少 PAT_1，请将 GH_STATS_TOKEN Secret 传入生成步骤。');
  }

  const username = process.env.GITHUB_REPOSITORY_OWNER || 'Murlors';
  const cards = [
    {
      name: 'stats',
      path: 'profile/stats.svg',
      render: api,
      options: { username, show_icons: 'true', hide_border: 'true' },
    },
    {
      name: 'top-langs',
      path: 'profile/top-langs.svg',
      render: topLangs,
      options: {
        username,
        layout: 'compact',
        hide_border: 'true',
        exclude_repo: 'murlors.github.io',
      },
    },
  ];

  const outputs = [];
  for (const card of cards) {
    const started = performance.now();
    const result = await card.render(card.options);
    if (result?.status !== 'success') {
      const type = result?.error?.type || result?.status || 'UNKNOWN';
      const message = result?.error?.message || '核心库未返回成功结果';
      throw new Error(`${card.name} 生成失败（${type}）：${message}`);
    }
    if (typeof result.content !== 'string' || !result.content.trim()) {
      throw new Error(`${card.name} 未返回 SVG 内容。`);
    }
    outputs.push({ path: card.path, content: result.content });
    console.log(`Generated ${card.name} in ${((performance.now() - started) / 1000).toFixed(1)}s`);
  }

  await mkdir('profile', { recursive: true });
  for (const output of outputs) {
    await writeFile(output.path, output.content, 'utf8');
    console.log(`Wrote ${output.path}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
