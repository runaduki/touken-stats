$(document).ready(function () {
  if (typeof wanakana === 'undefined') {
    console.warn("wanakana が読み込まれていません。index.html で <script src='https://unpkg.com/wanakana'></script> を script.js より前に配置してください。");
  }

  var table = $('#touken-table').DataTable({
    ajax: {
      url: "touken.json",
      dataSrc: function (json) {
        // JSON を受け取ったら読み(ふりがな)を小文字ひらがなで追加・総合値を計算
        json.forEach(item => {
          // idを数値に（安全策）
          item.id = item.id !== undefined ? Number(item.id) : null;

          // 期待フィールドがない場合のデフォルト
          item.name = item.name || "";
          // JSON に 'reading' または 'kana'（読み）があることが前提
          // 例: "reading": "みかづきむねちか"（ひらがな） または "reading": "ミカヅキ"（カタカナ）
          item.reading = item.reading || item.kana || ""; 

          // normalize: ひらがなに（カタカナ→ひらがな、ローマ字→かなも変換）
          try {
            item.reading_hira = item.reading ? wanakana.toHiragana(String(item.reading).toLowerCase()) : "";
          } catch (e) {
            item.reading_hira = String(item.reading || "");
          }

          // 総合値が無ければ計算（数値が文字列のときも対応）
          if (item.total === undefined || item.total === null) {
            const nums = ['hp','attack','defense','mobility','power','critical','scout','conceal'];
            let sum = 0;
            nums.forEach(k => { sum += Number(item[k] || 0); });
            item.total = sum;
          }
        });
        console.log("読み込み完了: 件数=", json.length, "最初の行:", json[0]);
        return json;
      }
    },
    columns: [
      { data: "id" },
      { data: "name" },
      { data: "reading_hira", visible: false, searchable: true }, // 隠し列：読み（ひらがな化済み）
      { data: "type" },
      { data: "school" },
      { data: "total" },
      { data: "hp" },
      { data: "attack" },
      { data: "defense" },
      { data: "mobility" },
      { data: "power" },
      { data: "critical" },
      { data: "scout" },
      { data: "conceal" }
    ],
    columnDefs: [
      // id列：0を特別扱いして常に最上に
      {
        targets: 0,
        render: function (data, type) {
          if (type === 'sort' || type === 'type') {
            return Number(data) === 0 ? -Infinity : Number(data);
          }
          return data;
        }
      }
    ],
    order: [[0, "asc"]],
    scrollX: true,
    pageLength: 25,
    language: {
      url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/ja.json"
    }
  });

  // TOP3強調
  table.on('draw', function () {
    let rows = table.rows({ order: 'applied', search: 'applied' }).nodes();
    $(rows).removeClass('rank1 rank2 rank3');
    $(rows).slice(0, 3).each(function (i, row) {
      $(row).addClass('rank' + (i + 1));
    });
  });

  /* --- ここから検索の説明 ---
     DataTables の標準グローバル検索は "visible な列" や "searchable" なデータを対象にします。
     上で隠し列 reading_hira を searchable:true にしているので、
     検索ボックスに入れた文字列（ひらがな）が reading_hira にマッチすればヒットします。
     漢字で入力した場合は name（漢字）列にヒットします — つまり両対応です。
  */

  // デバッグ用: ネットワークやコンソールを確認したい場合に使う
  table.on('xhr', function () {
    console.log("XHR 完了: DataTables にデータが入っています。");
  });
});
