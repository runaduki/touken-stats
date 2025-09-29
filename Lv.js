let expTables = {};

fetch("./data/expTables.json")
  .then(response => response.json())
  .then(data => {
    expTables = data;
    console.log("経験値テーブル読み込み完了", expTables);
  })
  .catch(err => console.error("読み込みエラー:", err));

function calcLevel() {
  const type = document.getElementById("typeSelect").value;
  const expInput = document.getElementById("expInput").value;
  const result = document.getElementById("result");

  let exp = parseInt(expInput, 10);

  // デバッグログは変数を定義した後に！
  console.log("type:", type);
  console.log("exp:", exp);
  console.log("expTables:", expTables);

  if (isNaN(exp) || exp < 0) {
    result.textContent = "正しい累積経験値を入力してください。";
    return;
  }

  const expTable = expTables[type];
  console.log("expTable:", expTable);

  if (!expTable) {
    result.textContent = "データがありません。";
    return;
  }

  let level = 1;
  for (let i = 0; i < expTable.length; i++) {
    if (exp >= expTable[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  let nextLevelExp = expTable[level] || "MAX";
  let toNext = (nextLevelExp !== "MAX") ? nextLevelExp - exp : 0;

  result.innerHTML = `
    
    累積EXP: <strong>${exp}</strong><br>
    ⇒ Lv.<strong>${level}</strong><br>
    ${nextLevelExp !== "MAX" ? `次まで: <strong>${toNext}</strong> EXP` : "カンスト！"}
  `;
}
