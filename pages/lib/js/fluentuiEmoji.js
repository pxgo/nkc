const fluentuiEmoji = require('../../../public/fluentuiEmoji.json');
const fluentuiEmoji_unicode_emoji = {};
const fluentuiEmojiObject = [];
for (const group of fluentuiEmoji) {
  const name = group.name;
  const emojiArr = [];
  for (const emoji of group.emoji) {
    const [unicode, glyph] = emoji.split(',');
    fluentuiEmoji_unicode_emoji[unicode] = {
      unicode,
      glyph,
    };

    emojiArr.push({
      unicode,
      glyph,
    });
  }
  fluentuiEmojiObject.push({
    name,
    emoji: emojiArr,
  });
}
function getEmojiCharByUnicode(unicode) {
  const emoji = fluentuiEmoji_unicode_emoji[unicode];
  if (!emoji) {
    return '?';
  }
  return emoji.glyph;
}

export { fluentuiEmojiObject, getEmojiCharByUnicode };
