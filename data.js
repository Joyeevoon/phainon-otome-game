/* 数据中心：所有素材路径、目标点（视频帧百分比）、台词集中在此 */

// BGM：首页（美人鱼.mp3 / MP3 2）与游戏内（last page.mp3 / MP3 1）
export const BGM = {
  home: "assets/audio/bgm.mp3",        // 美人鱼 16s（首页）
  game: "assets/audio/home-bgm.mp3",    // last page 127s（游戏内）
};

export const HOME_VIDEO = "assets/video/home.mp4";             // 16s（视频1）
export const LOADER_CHARACTER = "assets/stickers/chibi.webp";   // 加载页角色（参考图1）

// 贴纸顺序 = 游戏顺序：头发 → 脖子 → 锁骨 → 腹肌 → 心口
export const STICKERS = [
  {
    id: 1,
    label: "小鱼",
    img: "assets/stickers/sticker-1.webp",
    audio: "assets/audio/audio-1.mp3",
    target: { x: 47.0, y: 16.5 },
    size: 7.5,
    line: "“哇，贴我头发上！还挺有意思的。”",
    sub: "（头顶一凉，眨眨眼抬手摸头上的贴纸，脸颊浅浅发烫，咧嘴笑）",
  },
  {
    id: 2,
    label: "太阳",
    img: "assets/stickers/sticker-2.webp",
    audio: "assets/audio/audio-2.mp3",
    target: { x: 54.0, y: 33.5 },
    size: 6.75,
    line: "“贴在这里会有点痒。不过…… 若是你想，也可以。”",
    sub: "（脖颈传来微凉贴纸的触感，身体轻轻一顿，下意识放缓呼吸，微微偏过头，声音放得更轻）",
  },
  {
    id: 3,
    label: "冰块",
    img: "assets/stickers/sticker-3.webp",
    audio: "assets/audio/audio-3.mp3",
    target: { x: 44.0, y: 38.5 },
    size: 6,
    line: "“等、等一下，这里…… 会不会太近啦。”",
    sub: "（贴纸贴上锁骨，他瞬间僵住，眼神慌乱飘向别处，耳朵通红）",
  },
  {
    id: 4,
    label: "冰淇淋",
    img: "assets/stickers/sticker-4.webp",
    audio: "assets/audio/audio-4.mp3",
    target: { x: 55.0, y: 52.0 },
    size: 5.625,
    line: "“…… 这样的位置，会不会太大胆了。也罢，随你的心意。”",
    sub: "（贴纸贴上腰腹，他呼吸微滞，指尖虚虚搭在你的手腕边，没有推开，耳根红得更深，语气带着一丝窘迫却依旧包容）",
  },
  {
    id: 5,
    label: "勿忘我",
    img: "assets/stickers/sticker-5.webp",
    audio: "assets/audio/audio-5.mp3",
    target: { x: 42.0, y: 44.5 },
    size: 5.25,
    line: "“贴在离心脏最近的地方。我会好好保管这份属于你的小印记。”",
    sub: "（贴纸稳稳落在心口的位置，他抬手轻轻覆住胸口那枚贴纸，眼底满是柔软的暖意，低头静静望着你）",
  },
];

export const VIDEOS = {
  idle: "assets/video/idle.mp4",
  speaking: "assets/video/speaking.mp4",
};

export const FAVOR_PER_STICKER = 20;
