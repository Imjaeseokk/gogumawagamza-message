// app.js

// ----------------------------
// Hangul tables (standard)
// ----------------------------
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG = ["", "ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

// ----------------------------
// Your symbol sets
// - consonants: use 14 (discard remaining 2)
// - vowels: 20 + extra ◣ = 21
// ----------------------------
const CON_SYMBOLS = ["•","‥","⁚","…","‹","›","«","»","*","¦","⊕","⊛","⊗","⊖"]; // 14
const VOW_SYMBOLS = ["◀","▶","◁","▷","▲","△","▽","▼","◉","◎","◓","◒","◤","◥","◢","◬","◩","◪","■","□","◣"]; // 21

// base consonants only (14)
const BASE_CONS = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const CONS_MAP = new Map(BASE_CONS.map((jamo, i) => [jamo, CON_SYMBOLS[i]]));
const VOW_MAP = new Map(JUNG.map((jamo, i) => [jamo, VOW_SYMBOLS[i]]));

// split maps (as per your policy)
const DOUBLE_CHO_SPLIT = new Map([
  ["ㄲ", ["ㄱ","ㄱ"]],
  ["ㄸ", ["ㄷ","ㄷ"]],
  ["ㅃ", ["ㅂ","ㅂ"]],
  ["ㅆ", ["ㅅ","ㅅ"]],
  ["ㅉ", ["ㅈ","ㅈ"]],
]);

const CLUSTER_JONG_SPLIT = new Map([
  ["ㄳ", ["ㄱ","ㅅ"]],
  ["ㄵ", ["ㄴ","ㅈ"]],
  ["ㄶ", ["ㄴ","ㅎ"]],
  ["ㄺ", ["ㄹ","ㄱ"]],
  ["ㄻ", ["ㄹ","ㅁ"]],
  ["ㄼ", ["ㄹ","ㅂ"]],
  ["ㄽ", ["ㄹ","ㅅ"]],
  ["ㄾ", ["ㄹ","ㅌ"]],
  ["ㄿ", ["ㄹ","ㅍ"]],
  ["ㅀ", ["ㄹ","ㅎ"]],
  ["ㅄ", ["ㅂ","ㅅ"]],
]);

function isHangulSyllable(ch) {
  const code = ch.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

function decomposeHangul(ch) {
  const code = ch.charCodeAt(0) - 0xAC00;
  const choIndex = Math.floor(code / (21 * 28));
  const jungIndex = Math.floor((code % (21 * 28)) / 28);
  const jongIndex = code % 28;
  return { cho: CHO[choIndex], jung: JUNG[jungIndex], jong: JONG[jongIndex] };
}

function consToSymbols(consJamo) {
  if (DOUBLE_CHO_SPLIT.has(consJamo)) {
    return DOUBLE_CHO_SPLIT.get(consJamo).map(c => CONS_MAP.get(c)).join("");
  }
  if (CONS_MAP.has(consJamo)) return CONS_MAP.get(consJamo);
  return consJamo;
}

function jongToSymbols(jongJamo) {
  if (!jongJamo) return "";
  // split double finals too
  if (jongJamo === "ㄲ") return consToSymbols("ㄱ") + consToSymbols("ㄱ");
  if (jongJamo === "ㅆ") return consToSymbols("ㅅ") + consToSymbols("ㅅ");

  if (CLUSTER_JONG_SPLIT.has(jongJamo)) {
    return CLUSTER_JONG_SPLIT.get(jongJamo).map(c => consToSymbols(c)).join("");
  }
  return consToSymbols(jongJamo);
}

function encodeText(text, options = {}) {
  const { useSep = false, sepChar = "|" } = options;
  let out = "";
  for (const ch of text) {
    if (!isHangulSyllable(ch)) {
      out += ch;
      continue;
    }
    const { cho, jung, jong } = decomposeHangul(ch);

    const choSym = consToSymbols(cho);
    const jungSym = VOW_MAP.get(jung) ?? jung;
    const jongSym = jongToSymbols(jong);

    out += choSym + jungSym + jongSym;
    if (useSep) out += sepChar;
  }
  return out;
}

// ----------------------------
// UI wiring
// ----------------------------
const $src = document.getElementById("src");
const $dst = document.getElementById("dst");
const $copyBtn = document.getElementById("copyBtn");

function render() {
  const text = $src.value ?? "";
  const encoded = encodeText(text, { useSep: false, sepChar: "|" });
  $dst.textContent = encoded;
}

$src.addEventListener("input", render);

$copyBtn.addEventListener("click", async () => {
  const text = $dst.textContent || "";
  const $copyIcon = $copyBtn.querySelector(".copy-icon");
  const $checkIcon = $copyBtn.querySelector(".check-icon");
  
  try {
    await navigator.clipboard.writeText(text);
    $copyIcon.style.display = "none";
    $checkIcon.style.display = "block";
    setTimeout(() => {
      $copyIcon.style.display = "block";
      $checkIcon.style.display = "none";
    }, 900);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    $copyIcon.style.display = "none";
    $checkIcon.style.display = "block";
    setTimeout(() => {
      $copyIcon.style.display = "block";
      $checkIcon.style.display = "none";
    }, 900);
  }
});

render();

// 1) elements 추가로 잡기
const $tableBtn = document.getElementById("tableBtn");
const $popover = document.getElementById("mapPopover");
const $consTable = document.getElementById("consTable");
const $vowTable = document.getElementById("vowTable");

// 2) 테이블 내용 렌더(현재 CONS_MAP/VOW_MAP 기준으로 자동 생성)
function buildMappingTable() {
  // 자음(기본 14)
  $consTable.innerHTML = BASE_CONS.map((j) => {
    const sym = CONS_MAP.get(j) ?? "";
    return `
      <div class="map-item">
        <div class="map-left">${j}</div>
        <div class="map-right">${sym}</div>
      </div>
    `;
  }).join("");

  // 모음(21)
  $vowTable.innerHTML = JUNG.map((j) => {
    const sym = VOW_MAP.get(j) ?? "";
    return `
      <div class="map-item">
        <div class="map-left">${j}</div>
        <div class="map-right">${sym}</div>
      </div>
    `;
  }).join("");
}

// 3) popover 위치: 버튼 아래(출력 박스 위쪽)에 자연스럽게
function positionPopover() {
  const btnRect = $tableBtn.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  // popover를 버튼 오른쪽 정렬에 가깝게(너무 오른쪽으로 튀지 않게 clamp)
  const desiredLeft = btnRect.right + scrollX - $popover.offsetWidth;
  const minLeft = 12 + scrollX;
  const maxLeft = (window.innerWidth - 12 - $popover.offsetWidth) + scrollX;
  const left = Math.max(minLeft, Math.min(desiredLeft, maxLeft));

  // 버튼 아래쪽에 붙이기
  const top = btnRect.bottom + scrollY + 10;

  $popover.style.left = `${left}px`;
  $popover.style.top = `${top}px`;
}

// 4) show/hide
let popoverOpen = false;

function openPopover() {
  if (!popoverOpen) {
    $popover.hidden = false;
    positionPopover();
    popoverOpen = true;
  }
}

function closePopover() {
  if (popoverOpen) {
    $popover.hidden = true;
    popoverOpen = false;
  }
}

// 5) 동작 규칙
// - 아이콘에 hover하면 나타남
// - popover 위에 마우스 있으면 유지
// - popover 밖으로 hover(= 둘 다 아닌 영역)하면 사라짐
let hideTimer = null;

function scheduleClose() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => closePopover(), 80);
}

function cancelClose() {
  clearTimeout(hideTimer);
}

$tableBtn.addEventListener("mouseenter", () => {
  cancelClose();
  openPopover();
});

$tableBtn.addEventListener("mouseleave", () => {
  // 버튼에서 빠졌을 때 바로 닫지 말고, popover로 이동할 여지를 줌
  scheduleClose();
});

$popover.addEventListener("mouseenter", () => {
  cancelClose();
  openPopover();
});

$popover.addEventListener("mouseleave", () => {
  scheduleClose();
});

// 창 크기/스크롤 변하면 위치 재계산(열려있을 때만)
window.addEventListener("resize", () => {
  if (popoverOpen) positionPopover();
});
window.addEventListener("scroll", () => {
  if (popoverOpen) positionPopover();
}, { passive: true });

// 초기 1회 테이블 생성
buildMappingTable();