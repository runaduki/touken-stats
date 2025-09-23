$(function () {
  let baseData = [];
  let kiwamiData = [];

  Promise.all([
    fetch("data/touken_base.json").then(r => r.json()).catch(() => []),
    fetch("data/touken_kiwami.json").then(r => r.json()).catch(() => [])
  ]).then(([base, kiwami]) => {
    baseData = base || [];
    kiwamiData = kiwami || [];

    // ランキング対象のステータスキー
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

    stats.forEach(({ key, label }) => {
      initRanking("base", key, `ranking-base-${key}`, label);
      initRanking("kiwami", key, `ranking-kiwami-${key}`, label);
    });
  });

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

  function createRankingTable(tableId, data, statKey, label) {
    // 降順ソート
    data.sort((a, b) => b[statKey] - a[statKey]);

    let rankingData = [];
    let prevValue = null;
    let displayRank = 0;

    data.forEach((item, i) => {
      if (item[statKey] !== prevValue) {
        displayRank = i + 1;
      }
      prevValue = item[statKey];

      // メダル変換
      let rankDisplay;
      if (displayRank === 1) rankDisplay = "🥇";
      else if (displayRank === 2) rankDisplay = "🥈";
      else if (displayRank === 3) rankDisplay = "🥉";
      else rankDisplay = displayRank;

      rankingData.push({
        rank: rankDisplay,
        name: item.link,
        type: item.type,
        school: item.school,
        value: item[statKey]
      });
    });

    // DataTable 生成
    $(`#${tableId}`).DataTable({
      data: rankingData,
      destroy: true,
      paging: false,
      searching: false,
      info: false,
      ordering: false,
      scrollX: true,
      columns: [
        { title: "順位", data: "rank", width: "50px" },
        { title: "名前", data: "name", width: "180px" },
        { title: "刀種", data: "type", width: "80px" },
        { title: "刀派", data: "school", width: "120px" },
        { title: label, data: "value", width: "60px" }
      ]
    });
  }
});

// スムーズスクロール
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 一発でページ先頭へ
function scrollToTop() {
  window.scrollTo(0, 0);
}
