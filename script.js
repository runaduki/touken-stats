$(document).ready(function () {
  fetch("touken.json")
    .then(res => res.json())
    .then(data => {
      $('#touken-table').DataTable({
        data: data, // ← JSON配列をそのまま渡す
        columns: [
          { data: "id" },       // 刀帳番号
          { data: "name" },     // 名前
          { data: "type" },     // 刀種
          { data: "hp" },       // 生存
          { data: "attack" },   // 打撃
          { data: "defense" },  // 統率
          { data: "mobility" }, // 機動
          { data: "power" },    // 衝力
          { data: "critical" }, // 必殺
          { data: "scout" },    // 偵察
          { data: "conceal" },  // 隠蔽
          {
            data: null, // 総合値（JSONにないので計算）
            render: function (row) {
              return row.hp + row.attack + row.defense +
                     row.mobility + row.power + row.critical +
                     row.scout + row.conceal;
            }
          }
        ],
        scrollX: true,
        pageLength: 25,
        language: {
          search: "検索:",
          lengthMenu: "_MENU_ 件表示",
          info: "全_TOTAL_件中 _START_件から_END_件を表示",
          paginate: {
            first: "先頭",
            last: "最後",
            next: "次",
            previous: "前"
          }
        }
      });
    })
    .catch(err => console.error("JSON読み込みエラー:", err));
});
