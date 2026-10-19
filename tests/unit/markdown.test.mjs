// HTML bodies to Markdown (spec 07a). The rendered result is covered by "A Markdown body" in pages.feature.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bodyMarkdown, rewriteBody, toMarkdown } from '../../scripts/migrate.mjs';

const md = (html) => toMarkdown(rewriteBody(html).html).markdown;

test('paragraphs, headings, emphasis and links', () => {
  assert.equal(
    md('<h2>Who</h2><p>We <strong>meet </strong>on <em>Sunday</em> at <a href="https://example.org/a" target="_blank" style="color:blue">the hall</a>.</p>'),
    '## Who\n\nWe **meet** on *Sunday* at [the hall](https://example.org/a).\n',
  );
});

test('mail and phone links are kept, adjacent links stay as written', () => {
  assert.equal(md('<p><a href="mailto:a@b.uk">a</a><a href="mailto:c@d.uk">@b.uk</a> <a href="tel:01772">01772</a></p>'), '[a](mailto:a@b.uk)[@b.uk](mailto:c@d.uk) [01772](tel:01772)\n');
});

test('an image linking to a bigger copy becomes the bigger copy, with no link and no sizes', () => {
  assert.equal(
    md('<p style="text-align:center"><a href="/uploads/big.jpg"><img alt="Roof" src="/uploads/small.jpg" width="300" height="200"></a></p>'),
    '![Roof](/uploads/big.jpg)\n',
  );
});

test('an image linking to a page keeps its link', () => {
  assert.equal(md('<p><a href="https://example.org/appeal"><img alt="Appeal" src="/uploads/a.jpg"></a></p>'), '[![Appeal](/uploads/a.jpg)](https://example.org/appeal)\n');
});

test('a figure becomes the image and its caption', () => {
  assert.equal(md('<div style="text-align:center"><figure class="image"><img alt="Night" src="/uploads/n.jpg"><figcaption>At night</figcaption></figure></div>'), '![Night](/uploads/n.jpg)\n\nAt night\n');
});

test('jump menus lose their links and targets', () => {
  assert.equal(
    md('<h3>[ <a href="#Sunday">Sunday</a> ] - [ <a href="#Little People">Little People</a> ]</h3><p><a id="Sunday" name="Sunday"></a>Sunday</p>'),
    '### [ Sunday ] - [ Little People ]\n\nSunday\n',
  );
});

test('a line break starts a new paragraph, inside bold too', () => {
  assert.equal(md('<p>Church Road<br>Warton</p>'), 'Church Road\n\nWarton\n');
  assert.equal(md('<p><strong>One<br>Two</strong></p>'), '**One**\n\n**Two**\n');
});

test('underline, superscript, spans and non-breaking spaces leave only their text', () => {
  assert.equal(md('<p><u>Note</u> the 27<sup>th</sup>&nbsp;&nbsp;<span dir="ltr">November</span></p><p>&nbsp;</p>'), 'Note the 27th November\n');
});

test('a text table becomes a pipe table without its empty rows', () => {
  assert.equal(
    md('<table style="width:800px"><thead><tr><th>Role</th><th>Name</th></tr></thead><tbody><tr><td>Vicar</td><td>A | B</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>Warden</td><td>&nbsp;</td></tr></tbody></table>'),
    '| Role | Name |\n| --- | --- |\n| Vicar | A \\| B |\n| Warden |  |\n',
  );
});

test('a table of images becomes its cells in reading order', () => {
  assert.equal(
    md('<table><tr><td><a href="/a-large.jpg"><img src="/a.jpg" alt=""></a></td><td><img src="/b.jpg" alt="B"></td></tr><tr><td><p>Caption</p></td><td>&nbsp;</td></tr></table>'),
    '![](/a-large.jpg)\n\n![B](/b.jpg)\n\nCaption\n',
  );
});

test('lists', () => {
  assert.equal(md('<ul><li>One</li><li><strong>Two</strong></li></ul>'), '- One\n- **Two**\n');
});

test('asterisk banners become a divider or bold text', () => {
  assert.equal(md('<p>Before</p><p>**********</p><p>After</p>'), 'Before\n\n---\n\nAfter\n');
  assert.equal(md('<p>********* Cancelled due to lockdown ************</p>'), '**Cancelled due to lockdown**\n');
  assert.equal(md('<p>*******Update - the magazine</p>'), '**Update - the magazine**\n');
});

test('only what Markdown would misread is escaped', () => {
  assert.equal(
    md('<p>7.30 pm</p><p>1. Masks</p><p>2) Bubbles</p><p>#PrayForTheRoof</p><p># Not a heading</p><p>- dash</p><p>+44</p><p>&gt; quoted</p><p>---</p><p>a_b_c and _x_ and *y* and `tick`</p><p>&lt;b&gt; and 3 &lt; 4 and [x](y) and &amp;amp;</p>'),
    [
      '7.30 pm', '1\\. Masks', '2\\) Bubbles', '#PrayForTheRoof', '\\# Not a heading', '\\- dash', '+44', '\\> quoted', '\\---',
      'a_b_c and \\_x\\_ and \\*y\\* and \\`tick\\`', '\\<b> and 3 < 4 and [x\\](y) and \\&amp;',
    ].join('\n\n') + '\n',
  );
});

test('a heading ending in # keeps it', () => {
  assert.equal(md('<h3>Room #</h3>'), '### Room \\#\n');
});

test('a link address with spaces or brackets is written so it still works', () => {
  assert.equal(md('<p><a href="/uploads/legacy/My File (1).pdf">form</a></p>'), '[form](</uploads/legacy/My File (1).pdf>)\n');
});

test('a tag with no Markdown form keeps the body as HTML, with the reason', () => {
  const html = '<p>Hello</p><blockquote>Quoted</blockquote>';
  assert.deepEqual(bodyMarkdown(html), { body: `${html}\n`, problem: '<blockquote>' });
  assert.equal(bodyMarkdown('<p>Hi <marquee>there</marquee></p>').problem, '<marquee>');
});

test('an empty body stays empty', () => {
  assert.deepEqual(bodyMarkdown(''), { body: '', problem: '' });
});
