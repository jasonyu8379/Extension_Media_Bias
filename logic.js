const checkTab = document.getElementById("webCheck")
const domain = document.getElementById("domain")
const ifMatch = document.getElementById("ifMatch")
const bias = document.getElementById("bias")
const indicator = document.getElementById("indicator")

const positions = {
  "far-left": 4, "left": 28, "left-center": 36,
  "center": 49, "right-center": 59, "right": 69, "far-right": 96
};

function normalizeBias(biasValue) {
  if (!biasValue) return "center";
  const b = biasValue.toLowerCase().trim();
  if (b === "least biased") return "center";
  if (b.includes("left") && b.includes("center"))  return "left-center";
  if (b.includes("right") && b.includes("center")) return "right-center";
  if (b.includes("right") && (b.includes("far") || b.includes("extreme") || b.includes("conspiracy"))) return "far-right";
  if (b.includes("left") && (b.includes("far") || b.includes("extreme"))) return "far-left";
  if (b.includes("left"))   return "left";
  if (b.includes("right"))  return "right";
  return "center";
}

function setBias(biasValue) {
  const normalized = normalizeBias(biasValue);
  const pos = positions[normalized] ?? 50;
  indicator.style.left = pos + "%";
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

document.addEventListener("DOMContentLoaded", async () => {
  const currTab = await getCurrentTab();
  if (!currTab) return;
  const urlThing = new URL(currTab.url);
  const domainInsert = urlThing.hostname.replace("www.", "");
  checkTab.textContent = urlThing.href;
  domain.textContent = domainInsert;
  checkCurrentURL(domainInsert);
});

async function loadCSV() {
  const url = chrome.runtime.getURL("data/mbfc_raw.csv");
  const response = await fetch(url);
  const text = await response.text();
  const rows = text.trim().split("\n");
  const headers = rows[0].split(",");
  return rows.slice(1).map(row => {
    const cols = row.split(",");
    return Object.fromEntries(headers.map((h, i) => [h.trim(), cols[i]?.trim()]));
  });
}

async function checkCurrentURL(currentURL) {
  const urls = await loadCSV();
  const foundMatch = urls.find(row => row["source"] === currentURL);

  if (foundMatch) {
    ifMatch.className = "status-badge known";
    document.getElementById("matchText").textContent = "Known news source";
    bias.textContent = foundMatch["bias"];
    setBias(foundMatch["bias"]);
  } else {
    ifMatch.className = "status-badge unknown";
    document.getElementById("matchText").textContent = "Not in database";
    bias.textContent = "N/A";
    setBias(null);
  }
}