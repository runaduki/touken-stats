// ✅ DataTables参照を外側に置く（全テーブル共通でアクセスするため）
const tableRefs = {};

// 🔽 メイン処理
$(function () {
  let baseData = [];
  let kiwamiData = [];

  // JSONを読み込む
  Promise.all([
    fetch("./data/touken_base.json").then(r => r.json()).catch(() => []),
    fetch("./data/touken_kiwami.json").then(r => r.json()).catch(() => [])
  ]).then(([base, kiwami]) => {
    baseData = base || [];
    kiwamiData = kiwami || [];

    const stats = [
      { key: "total", label: "総合値" },
      { key: "hp", label: "生存" },
      { key: "attack", label: "打撃" },
      { key: "defense", label: "統率" },
      { key: "mobility", label: "機動" },
      { key: "power", label: "衝力" },
      { key: "scout", label: "偵察" },
      { key: "conceal", label: "隠蔽" },
      { key: "critical", label: "必殺" }
    ];

    // 各ステータスごとにランキングを初期化
    stats.forEach(({ key, label }) => {
      initRanking("base", key, `ranking-base-${key}`, label);
      initRanking("kiwami", key, `ranking-kiwami-${key}`, label);
    });
  });

  // ------------------------
  // 各ランキングテーブル生成
  // ------------------------
  function initRanking(mode, statKey, tableId, label) {
    const dataSrc = mode === "base" ? baseData : kiwamiData;

    const data = dataSrc.map(item => {
      const s = item.stats || {};
      const total = (s.hp||0)+(s.attack||0)+(s.defense||0)+(s.mobility||0)+
                    (s.power||0)+(s.scout||0)+(s.conceal||0)+(s.critical||0);
      const value = (statKey === "total") ? total : (s[statKey] || 0);

      return {
        id: item.id,
        name: item.name,
        link: `<a href="detail.html?id=${item.id}">${item.name}</a>`,
        type: item.type,
        school: item.school || "-",
        value
      };
    });

    createRankingTable(tableId, data, "value", label);
  }

  // ------------------------
  // DataTable生成関数
  // ------------------------
  function createRankingTable(tableId, data, statKey, label) {
    // 値で降順ソート
    data.sort((a, b) => b[statKey] - a[statKey]);

    let rankingData = [];
    let prevValue = null;
    let displayRank = 0;

    data.forEach((item, i) => {
      if (item[statKey] !== prevValue) displayRank = i + 1;
      prevValue = item[statKey];

      let rankDisplay = displayRank === 1 ? "🥇" :
                        displayRank === 2 ? "🥈" :
                        displayRank === 3 ? "🥉" : displayRank;

      rankingData.push({
        rank: rankDisplay,
        name: item.link,
        type: item.type,
        school: item.school,
        value: item[statKey]
      });
    });

    // ✅ 検索機能はONだが、UIボックスは非表示（dom:'t'）
    const table = $(`#${tableId}`).DataTable({
      data: rankingData,
      destroy: true,
      paging: false,
      searching: true,   // ← 内部フィルタAPIを使うためON
      dom: 't',          // ← テーブル本体のみ表示（検索UI非表示）
      info: false,
      ordering: false,
      scrollX: true,
      columns: [
        { name: 'rank', title: "順位", data: "rank", width: "50px" },
        { name: 'name', title: "名前", data: "name", width: "180px" },
        { name: 'type', title: "刀種", data: "type", width: "80px" },
        { name: 'school', title: "刀派", data: "school", width: "120px" },
        { name: 'value', title: label, data: "value", width: "60px" }
      ],
      columnDefs: [
        {
          // HTMLリンク列の検索用にタグ除去（名前検索が必要なときも安全）
          targets: 1,
          render: function (data, type) {
            if (type === "filter" || type === "sort") {
              return $("<div>").html(data).text();
            }
            return data;
          }
        }
      ]
    });

    // 保存
    tableRefs[tableId] = table;
  }
});

// ------------------------
// タブ切り替え処理
// ------------------------

// 🔹 正規表現の特殊文字をエスケープ
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========== 各表ごとに独立したタブ切り替え ==========
$(document).on("click", ".tab-menu .tab-btn", function () {
  const $btn = $(this);
  const type = String($btn.data("type") || "").trim();
  const tableId = $btn.closest(".tab-menu").data("target");
  const table = tableRefs[tableId];
  if (!table) return;

  // ボタン見た目切替
  $btn.siblings().removeClass("active");
  $btn.addClass("active");

  const colIndex = table.column("type:name").index() ?? 2; // 刀種列
  if (type === "all" || type === "") {
    table.column(colIndex).search("").draw();
  } else {
    const regex = "^" + type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$";
    table.column(colIndex).search(regex, true, false).draw();
  }

  // 🔹 可視行データを取得して値でソート（降順）
  const visibleRows = table.rows({ filter: "applied" }).data().toArray();
  visibleRows.sort((a, b) => b.value - a.value);

  // 🔹 同順位処理
  let prevValue = null;
  let displayRank = 0;
  visibleRows.forEach((row, i) => {
    if (row.value !== prevValue) displayRank = i + 1;
    prevValue = row.value;

    if (displayRank === 1) row.rank = "🥇";
    else if (displayRank === 2) row.rank = "🥈";
    else if (displayRank === 3) row.rank = "🥉";
    else row.rank = displayRank;
  });

  // 🔹 テーブルに反映（行は消さずに上書き）
  const nodes = table.rows({ filter: "applied" }).nodes();
  $(nodes).each(function (i) {
    const cell = $(this).find("td").eq(0);
    cell.text(visibleRows[i].rank);
  });
});

// ==========================
// 🔼 ジャンプリンク用関数
// ==========================
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

//上に戻るボタンの処理
function scrollToTop() {
  window.scrollTo({
    top: 0,
     // スムーズに戻る
  });
}


