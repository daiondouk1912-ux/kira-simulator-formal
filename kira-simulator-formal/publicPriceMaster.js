// KirA 公開用 概算マスター
// 注意：このファイルには、お客さまに見えてよい概算レンジだけを入れます。
// 原価・人工原価・利益率などの内部情報は絶対に入れないでください。
(function () {
const PRICE_MASTER = {
  concrete: {
    label: '土間コンクリート',
    unit: '㎡',
    brackets: [
      { max: 15, low: 12000, high: 16000 },
      { max: 50, low: 12000, high: 15000 },
      { max: 100, low: 11000, high: 13000 },
      { max: Infinity, low: 10500, high: 12000 },
    ],
    minimum: { low: 120000, high: 180000 },
  },
  gravel: {
    label: '砕石敷き', unit: '㎡',
    brackets: [
      { max: 15, low: 5500, high: 7500 },
      { max: 40, low: 4800, high: 6500 },
      { max: 80, low: 4300, high: 5800 },
      { max: Infinity, low: 3800, high: 5200 },
    ],
    minimum: { low: 50000, high: 80000 },
  },
  weed_gravel: {
    label: '防草シート＋砕石敷き', unit: '㎡',
    brackets: [
      { max: 15, low: 7500, high: 10000 },
      { max: 40, low: 6500, high: 8500 },
      { max: 80, low: 5800, high: 7500 },
      { max: Infinity, low: 4800, high: 6500 },
    ],
    minimum: { low: 70000, high: 100000 },
  },
  turf: {
    label: '人工芝', unit: '㎡',
    brackets: [
      { max: 15, low: 9500, high: 12000 },
      { max: 40, low: 8500, high: 10500 },
      { max: 80, low: 7800, high: 9500 },
      { max: Infinity, low: 6800, high: 8500 },
    ],
    minimum: { low: 100000, high: 140000 },
  },
  privacy_fence: {
    label: '目隠しフェンス', unit: 'm',
    brackets: [{ max: Infinity, low: 22000, high: 26000 }],
    minimum: { low: 120000, high: 180000 },
  },
  block_add: {
    label: 'ブロック1段追加', unit: 'm',
    brackets: [{ max: Infinity, low: 4000, high: 5000 }],
    minimum: { low: 60000, high: 80000 },
  },
  block_new: {
    label: 'ブロック新設（ベースから）', unit: 'm',
    brackets: [{ max: Infinity, low: 12000, high: 14000 }],
    minimum: { low: 120000, high: 150000 },
  },
  carport1: { label: 'カーポート1台用', fixed: { low: 250000, high: 300000 } },
  carport2: { label: 'カーポート2台用', fixed: { low: 400000, high: 550000 } },
  concrete_break: {
    label: 'コンクリート解体',
    unit: '㎡',
    brackets: [
      { max: 10, low: 4000, high: 5500 },
      { max: 30, low: 3800, high: 5000 },
      { max: Infinity, low: 3500, high: 4500 },
    ],
    minimum: { low: 60000, high: 100000 },
  },
  block_break_top: {
    label: 'ブロック解体（上だけ）',
    unit: 'm',
    brackets: [
      { max: 10, low: 6000, high: 8000 },
      { max: 20, low: 5500, high: 7000 },
      { max: Infinity, low: 5000, high: 6500 },
    ],
    minimum: { low: 60000, high: 100000 },
  },
  block_break_base: {
    label: 'ブロック解体（ベースごと）',
    unit: 'm',
    brackets: [
      { max: 10, low: 9000, high: 12000 },
      { max: 20, low: 8000, high: 10500 },
      { max: Infinity, low: 7500, high: 9500 },
    ],
    minimum: { low: 100000, high: 150000 },
  },
  fence_remove: {
    label: 'フェンス撤去',
    unit: 'm',
    brackets: [
      { max: 10, low: 2500, high: 4000 },
      { max: 20, low: 2000, high: 3500 },
      { max: Infinity, low: 1800, high: 3000 },
    ],
    minimum: { low: 30000, high: 60000 },
  },
};

const WORK_OPTIONS = [
  { id: 'concrete', label: '土間コンクリート', note: '駐車場・アプローチなどのコンクリート舗装' },
  { id: 'gravel', label: '砕石敷き', note: '砕石のみの敷き込み' },
  { id: 'weed_gravel', label: '防草シート＋砕石敷き', note: '防草シート込みの砕石施工' },
  { id: 'turf', label: '人工芝', note: '人工芝の敷設' },
  { id: 'fence_mesh', label: 'メッシュフェンス', note: '設置方法と長さから概算' },
  { id: 'privacy_fence', label: '目隠しフェンス', note: '板塀・ルーバー系の目隠しフェンス' },
  { id: 'block_add', label: 'ブロック1段追加', note: '既存ブロック上への1段追加' },
  { id: 'block_new', label: 'ブロック新設（ベースから）', note: 'ベースから新設するブロック工事' },
  { id: 'carport', label: 'カーポート', note: '1台用・2台用・3台用相談' },
  { id: 'concrete_break', label: 'コンクリート解体', note: '既存土間や犬走りなどの解体' },
  { id: 'block_break_top', label: 'ブロック解体（上だけ）', note: '上積み部分のみ解体' },
  { id: 'block_break_base', label: 'ブロック解体（ベースごと）', note: '基礎ごと撤去する解体' },
  { id: 'fence_remove', label: 'フェンス撤去', note: '既存フェンスの撤去' },
  { id: 'tile_deck', label: 'タイルデッキ', note: '小さめから広めまで面積で概算' },
  { id: 'approach', label: 'アプローチ・園路', note: '玄関まわりや庭の通路など' },
  { id: 'stone_approach', label: 'タイル・石貼り系アプローチ', note: 'タイル・乱形石・石貼りなど' },
  { id: 'retaining_wall', label: '土留め・高低差調整', note: '低めのブロック土留め・型枠ブロックなど' },
  { id: 'edging', label: '見切り材・境界処理', note: '人工芝・砂利・植栽まわりの見切り' },
  { id: 'lighting', label: '照明・ライトアップ', note: '庭やアプローチの照明' },
  { id: 'drainage_adjust', label: '排水・桝まわり調整', note: '桝高さ調整や排水まわりの相談' },
  { id: 'gate_post', label: '門柱・ポストまわり', note: '機能門柱・造作門柱・宅配ボックスなど' },
  { id: 'custom_consult', label: 'その他の工事・気になる内容', note: '項目にない工事や迷う内容を入力できます' },
];

const AREA_KEYS = new Set(['concrete', 'gravel', 'weed_gravel', 'turf', 'concrete_break', 'tile_deck', 'approach', 'stone_approach']);
const QUANTITY_KEYS = ['concrete','gravel','weed_gravel','turf','privacy_fence','block_add','block_new','concrete_break','block_break_top','block_break_base','fence_remove'];
const PRESET_AREAS = {
  approach: { label: 'アプローチ程度（約5㎡）', value: 5 },
  car1: { label: '車1台分程度（約15㎡）', value: 15 },
  car2: { label: '車2台分程度（約30㎡）', value: 30 },
  garden: { label: '庭の一部（約20㎡）', value: 20 },
  large: { label: '広めの駐車場・庭（約50㎡）', value: 50 },
};

// 目安選択は基本的に共通ですが、人工芝だけは「駐車場」という表現を避けます。
const PRESET_AREAS_BY_WORK = {
  turf: {
    approach: { label: '小さめの庭まわり（約5㎡）', value: 5 },
    car1: { label: '庭の一部（約15㎡）', value: 15 },
    garden: { label: '庭の一部・ドッグラン小さめ（約20㎡）', value: 20 },
    car2: { label: '一般的な庭まわり（約30㎡）', value: 30 },
    large: { label: '広めの庭・ドッグランなど（約50㎡）', value: 50 },
  },
};

const V12_LABELS = {
  tile_deck: 'タイルデッキ',
  approach: 'アプローチ・園路',
  stone_approach: 'タイル・石貼り系アプローチ',
  retaining_wall: '土留め・高低差調整',
  edging: '見切り材・境界処理',
  lighting: '照明・ライトアップ',
  drainage_adjust: '排水・桝まわり調整',
  gate_post: '門柱・ポストまわり',
};

const RETAINING_TYPES = {
  low_block: '低めのブロック土留め',
  form_block: '型枠ブロック土留め',
  cast_concrete: '現場打ちコンクリート土留め・擁壁',
  unknown: 'よく分からないので相談したい',
};
const RETAINING_HEIGHTS = {
  low: { label: '低め', rate: 0.9 },
  normal: { label: '普通', rate: 1 },
  high: { label: '高め', rate: 1.3 },
};
const DRAINAGE_TYPES = {
  height: '桝高さ調整',
  cutdown: '桝切り下げ・周辺調整',
  route: '排水経路・配管調整あり',
};
const GATE_POST_TYPES = {
  simple: 'シンプル機能門柱',
  custom: '造作門柱',
  delivery: '宅配ボックス・照明あり',
  full: '門まわり一式',
};

  const KIRA_PUBLIC_PRICE_MASTER = {
    PRICE_MASTER: PRICE_MASTER,
    WORK_OPTIONS: WORK_OPTIONS,
    AREA_KEYS: AREA_KEYS,
    QUANTITY_KEYS: QUANTITY_KEYS,
    PRESET_AREAS: PRESET_AREAS,
    PRESET_AREAS_BY_WORK: PRESET_AREAS_BY_WORK,
    V12_LABELS: V12_LABELS,
    RETAINING_TYPES: RETAINING_TYPES,
    RETAINING_HEIGHTS: RETAINING_HEIGHTS,
    DRAINAGE_TYPES: DRAINAGE_TYPES,
    GATE_POST_TYPES: GATE_POST_TYPES,
  };

  if (typeof window !== 'undefined') {
    window.KIRA_PUBLIC_PRICE_MASTER = KIRA_PUBLIC_PRICE_MASTER;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = KIRA_PUBLIC_PRICE_MASTER;
  }
})();
