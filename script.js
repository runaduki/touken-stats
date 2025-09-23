// script.js
$(function () {
  // キャッシュ用データ
  let baseData = [];
  let kiwamiData = [];

  // 表示モード
  let currentView = "tok"; // デフォルトを "base" (特だけ) にする

document.addEventListener("click", e => {
  if (!e.target.classList.contains("mode-btn")) return;

const btn = e.target;
  const mode = btn.dataset.mode;

  // 押しても .active は付けない
   btn.classList.remove("active");

  if (mode === "reset") {
    // 刀種・刀派の選択をリセット
    activeTypes.clear();
    activeSchools.clear();
    document.querySelectorAll(".filter-btn.active").forEach(btn => btn.classList.remove("active"));
  } else {
    currentMode = mode;
  }

  applyFilters();
});

function applyFilters() {
  document.querySelectorAll("#toukenTable tbody tr").forEach(tr => {
    const isKiwami = tr.dataset.stage === "極"; // JSONに stage を追加する想定
    const isTok = tr.dataset.stage === "特";

    // モード切替判定
    let matchMode = true;
    if (currentMode === "tok") matchMode = isTok;
    if (currentMode === "kiwami") matchMode = isKiwami;

    // 刀種・刀派フィルタ
    const matchType = activeTypes.size === 0 || activeTypes.has(tr.dataset.type);
    const matchSchool = activeSchools.size === 0 || activeSchools.has(tr.dataset.school);

    tr.style.display = matchMode && matchType && matchSchool ? "" : "none";
  });
}


  // フィルター状態
  const activeTypes = new Set();
  const activeSchools = new Set();

  // DataTable を空データで初期化（1回だけ）
  const table = $('#touken-table').DataTable({
  data: [],
  columns: [
    { data: "id", width: "60px" },
    { data: "name", width: "180px",
      render: (d, t, row) => `<a class="touken-name" href="detail.html?id=${row.id}">${d}</a>` },
    { data: "type", width: "80px" },
    { data: "school", width: "120px" },

    // 👇 総合値（ここを追加）
    { 
      data: null, 
      className: "col-total",
      render: function (d, t, row) {
        const s = row.stats || {};
        return (s.hp||0) + (s.attack||0) + (s.defense||0) + (s.mobility||0) +
               (s.power||0) + (s.scout||0) + (s.conceal||0) + (s.critical||0);
      }
    },
    
  { data: "stats.hp",        className: "col-hp" },
    { data: "stats.attack",    className: "col-atk" },
    { data: "stats.defense",   className: "col-def" },
    { data: "stats.mobility",  className: "col-spd" },
    { data: "stats.power",     className: "col-pow" },
    { data: "stats.scout",     className: "col-scout" },
    { data: "stats.conceal",   className: "col-hide" },
    { data: "stats.critical",  className: "col-crit" }
  ],
  order: [[0, "asc"]],
  scrollX: true,
  language: {
    url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/ja.json"
  },
  dom: 'ft',
  paging: false
});


  // まず2つのJSONを読み込む（kiwamiファイルが無ければ空配列扱い）
  Promise.all([
    fetch("data/touken_base.json").then(r => r.ok ? r.json() : []).catch(() => []),
    fetch("data/touken_kiwami.json").then(r => r.ok ? r.json() : []).catch(() => [])
  ]).then(([base, kiwami]) => {
    baseData = Array.isArray(base) ? base : [];
    kiwamiData = Array.isArray(kiwami) ? kiwami : [];

// JSON読込後
$('.mode-btn').removeClass('active');               // 全部リセット
//$('.mode-btn[data-mode="tok"]').addClass('active'); // 「特だけ」だけ赤
currentView = "tok"; // デフォルトは tok
updateTable();       // 表示を更新


    // Table に初期表示（特だけ）
    updateTable();
  }).catch(err => {
    console.error('JSON 読み込みでエラー', err);
  });


  // 表示を更新する関数
function updateTable() {
let data = [];
  if (currentView === "tok") {
    data = baseData.slice();       // 特だけ
  } else if (currentView === "kiwami") {
    data = kiwamiData.slice();     // 極だけ
  } else if (currentView === "both") {
    data = baseData.concat(kiwamiData); // 両方
  } else if (currentView === "kiwami-exist") {
    // baseData の中で kiwami:true のものだけ
    data = baseData.filter(item => item.kiwami === true);
  }
  
// 正規化
  const normalized = data.map(item => {
    const it = Object.assign({}, item);
     it.school = it.school || "-";   // データは "-" のまま残す
    it.type = it.type || "";
    it.stats = it.stats || {};
    return it;
  });

    table.clear();
    table.rows.add(normalized);
    table.draw();

    // 既存フィルタ（刀種/刀派）があるなら再適用
    applyColumnFilters();
  }



  // フィルターボタン（刀種/刀派）のクリックでトグル
  $(document).on('click', '.filter-btn', function () {
      if ($(this).hasClass('mode-btn')) return;
   const $b = $(this).toggleClass('active');
  const t = $b.data('type');
  const s = $b.data('school');

 if (t !== undefined) {
    if (activeTypes.has(t)) activeTypes.delete(t);
    else activeTypes.add(t);
  }
    if (s !== undefined) {
    if (activeSchools.has(s)) activeSchools.delete(s);
    else activeSchools.add(s);
  }　else if (currentView === "kiwami-exist") {
    // baseData の中で kiwami:true のものだけ
    data = baseData.filter(item => item.kiwami === true);
  }

  applyColumnFilters();
  });

  // モード切替（特 / 極 / 両方 / 選択解除）
$(document).on('click', '.mode-btn', function () {
  const mode = $(this).data('mode');

  if (mode === "reset") {
    activeTypes.clear();
    activeSchools.clear();
    $('.filter-btn').removeClass('active');
    applyColumnFilters();
    return;
  }



  // 特 / 極 / 両方切り替え
  currentView = mode;
  updateTable();
});

  // DataTables のカラム検索で絞り込む（AND条件）
  function applyColumnFilters() {
    // 刀種（col index 2）
    if (activeTypes.size) {
      const pattern = '^(' + [...activeTypes].map(escapeRegex).join('|') + ')$';
      table.column(2).search(pattern, true, false);
    } else {
      table.column(2).search('');
    }

    // 刀派（col index 3）
    if (activeSchools.size) {
      const pattern = '^(' + [...activeSchools].map(escapeRegex).join('|') + ')$';
      table.column(3).search(pattern, true, false);
    } else {
      table.column(3).search('');
    }

    table.draw();
  }

  function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
});








