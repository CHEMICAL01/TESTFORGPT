const itemData = [
  {
    name: "Valkyrie Helm",
    category: "limited",
    value: 150000,
    trend: "Rising",
    demand: "High",
    projected: false,
    updated: "2024-06-02",
  },
  {
    name: "Dominus Frigidus",
    category: "limited",
    value: 600000,
    trend: "Rising",
    demand: "Extreme",
    projected: false,
    updated: "2024-06-01",
  },
  {
    name: "Classic ROBLOX Fedora",
    category: "limited",
    value: 135000,
    trend: "Steady",
    demand: "High",
    projected: false,
    updated: "2024-06-03",
  },
  {
    name: "Rainbow Shaggy",
    category: "limited",
    value: 85000,
    trend: "Cooling",
    demand: "Medium",
    projected: false,
    updated: "2024-06-03",
  },
  {
    name: "Sinister Q",
    category: "collectible",
    value: 25000,
    trend: "Steady",
    demand: "Medium",
    projected: false,
    updated: "2024-06-02",
  },
  {
    name: "Teal Top Hat with White Band",
    category: "collectible",
    value: 12000,
    trend: "Rising",
    demand: "Medium",
    projected: false,
    updated: "2024-06-01",
  },
  {
    name: "Aurora Sparkslayer",
    category: "ugc",
    value: 4200,
    trend: "Rising",
    demand: "High",
    projected: false,
    updated: "2024-06-02",
  },
  {
    name: "Cyber Oni Mask",
    category: "ugc",
    value: 5200,
    trend: "Steady",
    demand: "Medium",
    projected: false,
    updated: "2024-06-04",
  },
  {
    name: "Headless Horseman",
    category: "event",
    value: 32000,
    trend: "Steady",
    demand: "High",
    projected: false,
    updated: "2024-05-30",
  },
  {
    name: "Pumpkin Fedora 2014",
    category: "event",
    value: 4800,
    trend: "Cooling",
    demand: "Low",
    projected: true,
    updated: "2024-05-29",
  },
  {
    name: "Blue Sparkle Time Fedora",
    category: "limited",
    value: 480000,
    trend: "Rising",
    demand: "Extreme",
    projected: false,
    updated: "2024-06-04",
  },
  {
    name: "Pink Mermaid Princess",
    category: "collectible",
    value: 7000,
    trend: "Steady",
    demand: "Medium",
    projected: false,
    updated: "2024-06-03",
  },
  {
    name: "Emerald Valkyrie",
    category: "limited",
    value: 220000,
    trend: "Rising",
    demand: "High",
    projected: false,
    updated: "2024-06-02",
  },
  {
    name: "Poison Horns",
    category: "limited",
    value: 42000,
    trend: "Cooling",
    demand: "Medium",
    projected: false,
    updated: "2024-06-04",
  },
  {
    name: "Clockwork's Headphones",
    category: "limited",
    value: 95000,
    trend: "Steady",
    demand: "High",
    projected: false,
    updated: "2024-06-01",
  },
  {
    name: "Gargoyle King",
    category: "event",
    value: 6100,
    trend: "Rising",
    demand: "Medium",
    projected: false,
    updated: "2024-06-03",
  },
  {
    name: "Midnight Motor Madness",
    category: "event",
    value: 3700,
    trend: "Cooling",
    demand: "Low",
    projected: true,
    updated: "2024-05-28",
  },
  {
    name: "Galactic Warrior Helm",
    category: "ugc",
    value: 6100,
    trend: "Rising",
    demand: "High",
    projected: false,
    updated: "2024-06-04",
  },
  {
    name: "Nebula Tophat",
    category: "ugc",
    value: 2800,
    trend: "Steady",
    demand: "Medium",
    projected: false,
    updated: "2024-06-02",
  },
  {
    name: "Immortal Sword: Venom's Bite",
    category: "limited",
    value: 68000,
    trend: "Rising",
    demand: "High",
    projected: false,
    updated: "2024-06-02",
  },
];

const trendingItems = [
  {
    name: "Aurora Sparkslayer",
    change: "+12% this week",
    value: 4200,
    reason: "UGC creator spotlight + influencer demand",
  },
  {
    name: "Dominus Frigidus",
    change: "+45,000 value",
    value: 600000,
    reason: "Rare sale confirms bullish sentiment",
  },
  {
    name: "Gargoyle King",
    change: "+18% volume",
    value: 6100,
    reason: "Event rerun hype with limited crates",
  },
  {
    name: "Blue Sparkle Time Fedora",
    change: "+22,500 value",
    value: 480000,
    reason: "Consistent high-robux trades",
  },
];

const changelog = [
  {
    date: "June 4, 2024",
    entry:
      "UGC category refreshed with new rising stars and projected tag audit.",
  },
  {
    date: "June 2, 2024",
    entry: "Major limited sweep – Dominus series and Valks recalibrated.",
  },
  {
    date: "May 30, 2024",
    entry: "Added automated sales scraping for event items.",
  },
  {
    date: "May 25, 2024",
    entry: "Community feedback cycle complete – demand labels retuned.",
  },
];

let activeFilter = "all";
let sortColumn = "value";
let sortDirection = "desc";

const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const searchInput = document.getElementById("searchInput");
const tableBody = document.getElementById("itemTableBody");
const statsGrid = document.getElementById("statsGrid");
const filterButtons = document.querySelectorAll(".filters .pill-button");
const storageAvailable = (() => {
  if (typeof localStorage === "undefined") {
    return false;
  }
  try {
    const key = "vv-test";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn("Local storage unavailable, theme preference won't persist.");
    return false;
  }
})();

const formatNumber = (value) => value.toLocaleString();

function renderStats(data) {
  const totalItems = data.length;
  const rising = data.filter((item) => item.trend === "Rising").length;
  const projected = data.filter((item) => item.projected).length;
  const highestValue = data.reduce((acc, item) => Math.max(acc, item.value), 0);

  const stats = [
    { label: "Tracked items", value: formatNumber(totalItems) },
    { label: "Rising right now", value: formatNumber(rising) },
    { label: "Projected alerts", value: formatNumber(projected) },
    { label: "Top value", value: `R$${formatNumber(highestValue)}` },
  ];

  statsGrid.innerHTML = stats
    .map(
      (stat) => `
        <div class="stat">
          <span class="stat-label">${stat.label}</span>
          <span class="stat-value">${stat.value}</span>
        </div>
      `
    )
    .join("");
}

function getTrendClass(trend) {
  const value = trend.toLowerCase();
  if (value.includes("rise")) return "rising";
  if (value.includes("cool") || value.includes("drop")) return "cooling";
  return "steady";
}

function renderItems() {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = itemData.filter((item) =>
    activeFilter === "all" ? true : item.category === activeFilter
  );

  if (query) {
    filtered = filtered.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.trend.toLowerCase().includes(query) ||
        item.demand.toLowerCase().includes(query)
      );
    });
  }

  filtered.sort((a, b) => {
    const modifier = sortDirection === "asc" ? 1 : -1;
    if (sortColumn === "value") {
      return (a.value - b.value) * modifier;
    }
    if (sortColumn === "projected") {
      return (Number(a.projected) - Number(b.projected)) * modifier;
    }
    if (sortColumn === "updated") {
      return (
        (new Date(a.updated).getTime() - new Date(b.updated).getTime()) * modifier
      );
    }

    const valueA = String(a[sortColumn]).toLowerCase();
    const valueB = String(b[sortColumn]).toLowerCase();
    if (valueA < valueB) return -1 * modifier;
    if (valueA > valueB) return 1 * modifier;
    return 0;
  });

  tableBody.innerHTML = filtered
    .map((item) => {
      return `
        <tr>
          <td>
            <span class="item-name">${item.name}</span>
            <span class="item-tag">${item.category.toUpperCase()}</span>
          </td>
          <td>R$${formatNumber(item.value)}</td>
          <td><span class="badge-trend ${getTrendClass(item.trend)}">${item.trend}</span></td>
          <td>${item.demand}</td>
          <td class="projected ${item.projected ? "yes" : "no"}">
            ${item.projected ? "Yes" : "No"}
          </td>
          <td>${new Date(item.updated).toLocaleDateString()}</td>
        </tr>
      `;
    })
    .join("");
}

function renderTrendingCards() {
  const wrapper = document.getElementById("trendingCards");
  wrapper.innerHTML = trendingItems
    .map(
      (item) => `
        <article class="trending-card">
          <h3>${item.name}</h3>
          <p class="value">R$${formatNumber(item.value)}</p>
          <p class="meta">${item.change}</p>
          <p class="meta">${item.reason}</p>
        </article>
      `
    )
    .join("");
}

function renderChangelog() {
  const list = document.getElementById("changelogList");
  list.innerHTML = changelog
    .map(
      (entry) => `
        <li>
          <time>${entry.date}</time>
          <p>${entry.entry}</p>
        </li>
      `
    )
    .join("");
}

function toggleTheme() {
  const isLight = root.classList.toggle("light");
  themeToggle.querySelector(".icon").textContent = isLight ? "☀️" : "🌙";
  themeToggle.querySelector(".label").textContent = isLight ? "Light" : "Dark";
  if (storageAvailable) {
    localStorage.setItem("vv-theme", isLight ? "light" : "dark");
  }
}

function hydrateTheme() {
  if (!storageAvailable) return;
  const saved = localStorage.getItem("vv-theme");
  if (saved === "light") {
    root.classList.add("light");
    themeToggle.querySelector(".icon").textContent = "☀️";
    themeToggle.querySelector(".label").textContent = "Light";
  }
}

function initSort() {
  document.querySelectorAll("th[data-sort]").forEach((header) => {
    header.addEventListener("click", () => {
      const key = header.dataset.sort;
      if (sortColumn === key) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortColumn = key;
        sortDirection = key === "name" ? "asc" : "desc";
      }
      renderItems();
    });
  });
}

renderStats(itemData);
renderTrendingCards();
renderChangelog();
renderItems();
initSort();
hydrateTheme();

themeToggle.addEventListener("click", toggleTheme);
searchInput.addEventListener("input", renderItems);
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderItems();
  });
});
