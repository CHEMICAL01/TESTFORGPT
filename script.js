const API_ENDPOINT = "https://valuevaultx.com/_functions/api/ValueWebsiteTest";

const state = {
  games: [],
  filteredGames: [],
  featuredIndex: 0,
  query: "",
  sort: "featured",
  isLoading: false,
};

const grid = document.getElementById("gamesGrid");
const gamesCount = document.getElementById("gamesCount");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const searchInput = document.getElementById("gameSearch");
const sortSelect = document.getElementById("sortSelect");
const refreshButton = document.getElementById("refreshButton");
const retryButton = document.getElementById("retryButton");
const clearSearchButton = document.getElementById("clearSearch");
const statTotal = document.getElementById("stat-total");
const heroName = document.getElementById("heroFeaturedName");
const heroDescription = document.getElementById("heroFeaturedDescription");
const heroCount = document.getElementById("heroFeaturedCount");
const heroArt = document.getElementById("heroFeaturedArt");
const heroRefreshButton = document.getElementById("heroRefresh");

const skeletonCount = 6;

function renderSkeletons() {
  grid.innerHTML = "";
  for (let i = 0; i < skeletonCount; i += 1) {
    const skeleton = document.createElement("article");
    skeleton.className = "game-card game-card--skeleton";

    const art = document.createElement("div");
    art.className = "game-card__backdrop";
    skeleton.appendChild(art);

    const content = document.createElement("div");
    content.className = "game-card__content";

    const header = document.createElement("div");
    header.className = "game-card__header";

    const icon = document.createElement("div");
    icon.className = "skeleton-box skeleton-box--icon";
    header.appendChild(icon);

    const badge = document.createElement("div");
    badge.className = "skeleton-box skeleton-box--badge";
    header.appendChild(badge);

    content.appendChild(header);

    const title = document.createElement("div");
    title.className = "skeleton-box skeleton-box--title";
    content.appendChild(title);

    const paragraph = document.createElement("div");
    paragraph.className = "skeleton-box skeleton-box--paragraph";
    content.appendChild(paragraph);

    const footer = document.createElement("div");
    footer.className = "game-card__footer";

    const footerBox = document.createElement("div");
    footerBox.className = "skeleton-box skeleton-box--footer";
    footer.appendChild(footerBox);

    content.appendChild(footer);
    skeleton.appendChild(content);
    grid.appendChild(skeleton);
  }
}

function sanitizeUrl(url) {
  if (typeof url !== "string") return "";
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.href;
  } catch (error) {
    return "";
  }
}

function normalizeGame(entry, index) {
  const name = typeof entry.valueListName === "string" && entry.valueListName.trim().length
    ? entry.valueListName.trim()
    : `Untitled value list ${index + 1}`;

  const fieldNames = Array.isArray(entry.fieldNames)
    ? entry.fieldNames.map((label) =>
        typeof label === "string" ? label : String(label ?? "")
      )
    : [];

  const fieldIds = Array.isArray(entry.fieldIds)
    ? entry.fieldIds
        .map((id) => (typeof id === "string" ? id : String(id ?? "")))
        .filter((id) => id.length)
    : [];

  return {
    valueListName: name,
    seoDescription:
      typeof entry.seoDescription === "string" && entry.seoDescription.trim().length
        ? entry.seoDescription.trim()
        : "We will add a description for this game soon.",
    gameBackground: sanitizeUrl(entry.gameBackground),
    gameIcon: sanitizeUrl(entry.gameIcon),
    valueListApi: sanitizeUrl(entry.valueListApi),
    fieldNames,
    fieldIds,
  };
}

function updateStatusText(visibleListLength) {
  const total = state.games.length;
  if (!total) {
    gamesCount.textContent = state.isLoading
      ? "Loading value lists…"
      : "No value lists available yet.";
    return;
  }

  if (visibleListLength === total) {
    gamesCount.textContent = `Showing all ${total} value lists`;
  } else {
    gamesCount.textContent = `Showing ${visibleListLength} of ${total} value lists`;
  }
}

function setFeaturedCard(index = 0) {
  if (!state.games.length) {
    heroName.textContent = "Loading…";
    heroDescription.textContent = "We are gathering the latest data.";
    heroCount.textContent = "API endpoint connected";
    heroArt.style.backgroundImage = "";
    return;
  }

  const nextIndex = index % state.games.length;
  state.featuredIndex = nextIndex;
  const game = state.games[nextIndex];

  heroName.textContent = game.valueListName;
  heroDescription.textContent = game.seoDescription;
  heroCount.textContent = "Dynamic API ready";
  if (game.gameBackground) {
    heroArt.style.backgroundImage = `url('${game.gameBackground}')`;
  } else {
    heroArt.style.backgroundImage = "";
  }
}

function createCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";
  card.setAttribute("role", "listitem");
  if (game.gameBackground) {
    card.style.setProperty("--card-image", `url('${game.gameBackground}')`);
  }

  const backdrop = document.createElement("div");
  backdrop.className = "game-card__backdrop";
  card.appendChild(backdrop);

  const content = document.createElement("div");
  content.className = "game-card__content";

  const header = document.createElement("div");
  header.className = "game-card__header";

  if (game.gameIcon) {
    const icon = document.createElement("img");
    icon.className = "game-card__icon";
    icon.src = game.gameIcon;
    icon.alt = `${game.valueListName} icon`;
    icon.loading = "lazy";
    header.appendChild(icon);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "game-card__icon game-card__icon--placeholder";
    placeholder.textContent = game.valueListName.charAt(0).toUpperCase();
    header.appendChild(placeholder);
  }

  const badge = document.createElement("span");
  badge.className = "game-card__badge";
  badge.textContent = "Value list";
  header.appendChild(badge);

  content.appendChild(header);

  const title = document.createElement("h3");
  title.textContent = game.valueListName;
  content.appendChild(title);

  const description = document.createElement("p");
  description.textContent = game.seoDescription;
  content.appendChild(description);

  const footer = document.createElement("div");
  footer.className = "game-card__footer";

  const apiBadge = document.createElement("span");
  apiBadge.className = "game-card__meta";
  apiBadge.textContent = "API linked";
  footer.appendChild(apiBadge);

  const cta = document.createElement("button");
  cta.type = "button";
  cta.className = "button button--inline";
  cta.textContent = "Open value list";
  cta.dataset.api = game.valueListApi;
  cta.dataset.name = game.valueListName;
  cta.addEventListener("click", () => handleOpenValueList(game));
  footer.appendChild(cta);

  content.appendChild(footer);
  card.appendChild(content);

  return card;
}

function renderGames(list) {
  grid.innerHTML = "";
  if (!list.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  errorState.hidden = true;
  list.forEach((game) => {
    grid.appendChild(createCard(game));
  });
}

function applyFilters() {
  emptyState.hidden = true;
  errorState.hidden = true;
  const query = state.query.trim().toLowerCase();
  let filtered = [...state.games];

  if (query) {
    filtered = filtered.filter((game) => {
      return (
        game.valueListName.toLowerCase().includes(query) ||
        game.seoDescription.toLowerCase().includes(query)
      );
    });
  }

  switch (state.sort) {
    case "name-asc":
      filtered.sort((a, b) => a.valueListName.localeCompare(b.valueListName));
      break;
    case "name-desc":
      filtered.sort((a, b) => b.valueListName.localeCompare(a.valueListName));
      break;
    default:
      break;
  }

  state.filteredGames = filtered;
  renderGames(filtered);
  updateStatusText(filtered.length);
}

function handleOpenValueList(game) {
  if (!game.valueListApi) {
    window.alert("This value list is missing an API link. Please try again later.");
    return;
  }

  const payload = {
    name: game.valueListName,
    description: game.seoDescription,
    background: game.gameBackground,
    icon: game.gameIcon,
    api: game.valueListApi,
    fieldNames: Array.isArray(game.fieldNames) ? game.fieldNames : [],
    fieldIds: Array.isArray(game.fieldIds) ? game.fieldIds : [],
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem("valuevaultx:selectedList", JSON.stringify(payload));
  } catch (error) {
    // Ignore storage errors (e.g. disabled storage)
  }

  const slug = game.valueListName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  window.location.href = `value-list.html?list=${encodeURIComponent(slug)}`;
}

async function fetchGames() {
  state.isLoading = true;
  errorState.hidden = true;
  emptyState.hidden = true;
  renderSkeletons();
  updateStatusText(0);

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("The API returned an unexpected format.");
    }

    const games = payload.map(normalizeGame).filter((game) => !!game.valueListApi);

    state.games = games;
    statTotal.textContent = games.length.toString();
    setFeaturedCard(0);
    applyFilters();
  } catch (error) {
    console.error(error);
    grid.innerHTML = "";
    errorMessage.textContent = error.message || "Please check your connection and try again.";
    errorState.hidden = false;
    gamesCount.textContent = "Unable to load value lists.";
  } finally {
    state.isLoading = false;
  }
}

function attachEvents() {
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      applyFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      applyFilters();
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      if (!state.isLoading) {
        fetchGames();
      }
    });
  }

  if (retryButton) {
    retryButton.addEventListener("click", () => {
      if (!state.isLoading) {
        fetchGames();
      }
    });
  }

  if (clearSearchButton) {
    clearSearchButton.addEventListener("click", () => {
      searchInput.value = "";
      state.query = "";
      applyFilters();
      searchInput.focus();
    });
  }

  if (heroRefreshButton) {
    heroRefreshButton.addEventListener("click", () => {
      if (!state.games.length) return;
      const nextIndex = (state.featuredIndex + 1) % state.games.length;
      setFeaturedCard(nextIndex);
    });
  }
}

attachEvents();
fetchGames();
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
