import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

const categories = [
  {
    name: '常用',
    emoji:
      '😀 😄 🥹 😊 🥰 😎 🤔 😭 😂 🤭 🥳 😴 👍 👏 🤝 🙏 ❤️ 💚 🌹 🌿 ☀️ 🌈 🎉 🎁 ☕️ 🍰 🍜 🍻 🐱 🐶 ✨ 💪',
  },
  {
    name: '笑脸',
    emoji:
      '😀 😃 😄 😁 😆 😅 😂 🤣 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 ☺️ 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 😏 😌 😎 🤓 🧐 🥳 🤠 😺 😸 😹 😻 😼 😽',
  },
  {
    name: '情绪',
    emoji:
      '😒 🙄 😬 😮‍💨 🤥 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 😕 🫤 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 👻 💩 🤡',
  },
  {
    name: '手势',
    emoji:
      '👍 👎 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫴 🫳 👊 ✊ 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 💪 ✍️ 🤳 💅 🦾 👀 🫵',
  },
  {
    name: '爱心',
    emoji:
      '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💌 💋 🫂 🌹 🥀 💐 🌷 🌸 🌺 🌻 🌼 🎀 🎁 💍 💎',
  },
  {
    name: '动物',
    emoji:
      '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐽 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦋 🐌 🐞 🐝 🐢 🐍 🐙 🦑 🦐 🦀 🐠 🐟 🐬 🐳 🦈 🐘 🦒 🦌 🐕 🐈 🐾 🐉',
  },
  {
    name: '美食',
    emoji:
      '🍎 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍒 🍑 🥭 🍍 🥝 🍅 🥑 🥦 🌽 🥕 🍄 🥜 🍞 🥐 🧀 🍳 🥓 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🥗 🍝 🍜 🍲 🍛 🍚 🍙 🍣 🥟 🥮 🍢 🍡 🍦 🍨 🍩 🍪 🎂 🍰 🍫 🍬 🍭 ☕️ 🍵 🥛 🧋 🧃 🍺 🍻 🥂 🍷 🥃',
  },
  {
    name: '生活',
    emoji:
      '☀️ 🌤️ ⛅️ ☁️ 🌧️ ⛈️ ❄️ 🌙 ⭐️ 🌟 ✨ 🌈 🔥 💧 🌊 🌿 🍀 🍁 🏠 🏢 🏫 🏥 🚗 🚕 🚌 🚇 🚄 ✈️ 🚀 🧳 🏖️ ⛰️ 🎉 🎊 🧧 🏮 🎈 🎆 🎇 🎵 🎶 🎧 🎤 🎬 🎮 ⚽️ 🏀 🏸 🏆 📱 💻 📷 📚 ✏️ 💰 💸 💵 ⏰ ✅ ❌ ❓ ❗️ 💯',
  },
].map(({ name, emoji }) => ({ name, emojis: emoji.split(' ') }));

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <Tabs defaultValue="常用" className="emoji-picker">
      <TabsList className="emoji-categories" aria-label="表情分类">
        {categories.map(({ name }) => (
          <TabsTrigger key={name} value={name}>
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map(({ name, emojis }) => (
        <TabsContent key={name} value={name} className="emoji-content">
          <div className="emoji-grid" aria-label={`${name}表情`}>
            {emojis.map((emoji) => (
              <button key={emoji} aria-label={`表情 ${emoji}`} onClick={() => onSelect(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
