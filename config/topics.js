// Topic pages: one per section and topic in site/data/topics.yaml, at /{section}/topic/{slug},
// plus a topic index per section at /{section}/topic. Items carry their slug as computed `topic`.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export const TOPIC_SECTIONS = ['blog', 'calendar', 'notices'];

export function topicPages(topics) {
  return TOPIC_SECTIONS.flatMap((section) => Object.entries(topics ?? {}).map(([slug, label]) => ({ section, slug, label })));
}

export const withTopic = (items, slug) => (items ?? []).filter((item) => item.data.topic === slug);

export default function (eleventyConfig) {
  const topics = parse(readFileSync('site/data/topics.yaml', 'utf8'));
  eleventyConfig.addGlobalData('topicPages', topicPages(topics));
  eleventyConfig.addGlobalData('topicSections', TOPIC_SECTIONS);
  eleventyConfig.addFilter('withTopic', withTopic);
}
