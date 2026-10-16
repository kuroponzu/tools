const input = document.getElementById("ip-input");
const button = document.getElementById("lookup-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

const FIELD_LABELS = [
  ["ip", "IPアドレス"],
  ["country", "国"],
  ["region", "地域"],
  ["city", "都市"],
  ["postal", "郵便番号"],
  ["latitude", "緯度"],
  ["longitude", "経度"],
];

function renderResult(data) {
  const rows = [];
  for (const [key, label] of FIELD_LABELS) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      rows.push([label, data[key]]);
    }
  }
  if (data.isp) rows.push(["ISP", data.isp]);
  if (data.org) rows.push(["組織", data.org]);
  if (data.asn) rows.push(["ASN", data.asn]);
  if (data.timezone) rows.push(["タイムゾーン", data.timezone]);

  const sec = data.security;
  if (sec) {
    if (sec.anonymizer !== undefined)
      rows.push([
        "匿名化サービス(VPN/プロキシ/Tor)",
        sec.anonymizer ? "はい" : "いいえ",
      ]);
    if (sec.hosting !== undefined)
      rows.push(["データセンター/ホスティング", sec.hosting ? "はい" : "いいえ"]);
  }

  const table = document.createElement("table");
  table.className = "ip-result-table";
  rows.forEach(([label, value]) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = label;
    const td = document.createElement("td");
    td.textContent = String(value);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);
  });

  const fragment = document.createDocumentFragment();
  fragment.appendChild(table);
  if (sec) {
    fragment.appendChild(buildBlockAdvice(sec));
  }
  resultEl.replaceChildren(fragment);
}

function buildBlockAdvice(sec) {
  const box = document.createElement("div");
  box.className = "advice-box";

  const flags = [];
  if (sec.anonymizer) flags.push("匿名化サービス(VPN/プロキシ/Tor)");
  if (sec.hosting) flags.push("データセンター/クラウド");

  box.textContent =
    flags.length > 0
      ? `${flags.join("・")}経由の可能性があるIPです。個人の一般利用者が直接使っている可能性は低く、ブロックしても実害は比較的小さいと考えられます。ただし同じIP/レンジを他の正当な利用者が共有している場合もあるため、過剰ブロックには注意してください。`
      : "通常の個人/企業向けISPのIPのようです。ブロックすると実際の利用者に影響する可能性があるため、必要性を慎重に判断してください。";

  return box;
}

async function lookup() {
  const ip = input.value.trim();
  resultEl.replaceChildren();
  statusEl.textContent = "";

  if (!ip) {
    statusEl.textContent = "IPアドレスを入力してください";
    return;
  }

  statusEl.textContent = "検索中...";
  button.disabled = true;

  try {
    const res = await fetch(`/api/ip-info?ip=${encodeURIComponent(ip)}`);
    const data = await res.json();
    if (!res.ok) {
      statusEl.textContent = data.error || "エラーが発生しました";
      return;
    }
    statusEl.textContent = "";
    renderResult(data);
  } catch {
    statusEl.textContent = "通信エラーが発生しました";
  } finally {
    button.disabled = false;
  }
}

button.addEventListener("click", lookup);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") lookup();
});
