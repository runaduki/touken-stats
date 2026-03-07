let baseData = [];
let kiwamiData = [];

let currentMode = "base";
let currentStat = "total";
let currentType = "all";

let table;

// ----------------------------
// 初期処理
// ----------------------------
$(async function () {

  const [base, kiwami] = await Promise.all([
    fetch("./data/touken_base.json").then(r=>r.json()).catch(()=>[]),
    fetch("./data/touken_kiwami.json").then(r=>r.json()).catch(()=>[])
  ]);

  baseData = base;
  kiwamiData = kiwami;

  table = $("#ranking-table").DataTable({
    paging:false,
    searching:false,
    info:false,
    ordering:false,
    scrollX:true,
    columns:[
      {title:"順位", data:"rank", width:"60px"},
      {title:"名前", data:"name", width:"180px"},
      {title:"刀種", data:"type", width:"80px"},
      {title:"刀派", data:"school", width:"120px"},
      {title:"値", data:"value", width:"80px"}
    ]
  });

  updateRanking();
});


// ----------------------------
// ランキング更新
// ----------------------------
function updateRanking(){

  let src = currentMode === "base" ? baseData : kiwamiData;

  let data = src.map(item=>{

    const s = item.stats || {};

    const total =
      (s.hp||0)+(s.attack||0)+(s.defense||0)+(s.mobility||0)+
      (s.power||0)+(s.scout||0)+(s.conceal||0)+(s.critical||0);

    const value = currentStat==="total"
      ? total
      : (s[currentStat] || 0);

    return {
      name:`<a href="detail.html?id=${item.id}">${item.name}</a>`,
      type:item.type,
      school:item.school || "-",
      value
    };
  });

  if(currentType !== "all"){
    data = data.filter(d=>d.type === currentType);
  }

  data.sort((a,b)=>b.value-a.value);

  // ランク計算（連続順位）
  let prev=null;
  let rank=0;

  data.forEach(d=>{
    if(d.value !== prev) rank++;
    prev=d.value;

    if(rank===1) d.rank="🥇";
    else if(rank===2) d.rank="🥈";
    else if(rank===3) d.rank="🥉";
    else d.rank=rank;
  });

  table.clear().rows.add(data).draw();
}


// ----------------------------
// ナビクリック
// ----------------------------

$(".mode-btn").click(function(){

  $(".mode-btn").removeClass("active");
  $(this).addClass("active");

  currentMode = $(this).data("mode");

  updateRanking();
});


$(".stat-btn").click(function(){

  $(".stat-btn").removeClass("active");
  $(this).addClass("active");

  currentStat = $(this).data("stat");

  updateRanking();
});


$(".type-btn").click(function(){

  $(".type-btn").removeClass("active");
  $(this).addClass("active");

  currentType = $(this).data("type");

  updateRanking();
});
