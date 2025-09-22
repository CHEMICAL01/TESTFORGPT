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

  return {
    valueListName: name,
    seoDescription:
      typeof entry.seoDescription === "string" && entry.seoDescription.trim().length
        ? entry.seoDescription.trim()
        : "We will add a description for this game soon.",
    gameBackground: sanitizeUrl(entry.gameBackground),
    gameIcon: sanitizeUrl(entry.gameIcon),
    valueListApi: sanitizeUrl(entry.valueListApi),
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
