// Writes the fixture uploads with sharp, so no binary image is committed. Used by tests/serve.js --uploads and the unit tests.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const png = (dir, name, width, height) =>
  sharp({ create: { width, height, channels: 3, background: { r: 40, g: 90, b: 160 } } }).png().toFile(join(dir, name));

export async function writeFixtureUploads(dir) {
  mkdirSync(dir, { recursive: true });
  await png(dir, 'fixture-wide.png', 1600, 900);
  await png(dir, 'fixture-huge.png', 6000, 4000);
  await png(dir, 'Fixture Space.PNG', 900, 600);
  await sharp({ create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } } }).gif().toFile(join(dir, 'fixture.gif'));
  writeFileSync(join(dir, 'fixture.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>\n');
}
