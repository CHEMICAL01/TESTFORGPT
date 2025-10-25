(function () {
  const MASTER_API_ENDPOINT = "https://valuevaultx.com/_functions/api/ValueWebsiteTest";

  const state = {
    metadata: null,
    entries: [],
    filtered: [],
    categories: [],
    activeCategory: "all",
    query: "",
    isLoading: false,
  };

  const placeholder = document.getElementById("detailPlaceholder");
  const page = document.getElementById("valuePage");

  const heroTitle = document.getElementById("valueHeroTitle");
  const heroDescription = document.getElementById("valueHeroDescription");
  const heroArt = document.getElementById("valueHeroArt");
  const heroIcon = document.getElementById("valueHeroIcon");
  const heroIconFallback = document.getElementById("valueHeroIconFallback");
  const heroIconWrap = document.querySelector(".value-hero__icon-wrap");
  const heroBackground = document.getElementById("valueHeroBackground");
  const heroEntries = document.getElementById("valueHeroEntries");
  const heroUpdated = document.getElementById("valueHeroUpdated");

  const filtersContainer = document.getElementById("valueFilterChips");
  const searchInput = document.getElementById("valueSearch");
  const clearSearchButton = document.getElementById("valueClearSearch");
  const resetFiltersButton = document.getElementById("valueResetFilters");
  const retryButton = document.getElementById("valueRetry");

  const resultsCount = document.getElementById("valueResultsCount");
  const grid = document.getElementById("valueItemsGrid");
  const emptyState = document.getElementById("valueEmptyState");
  const errorState = document.getElementById("valueErrorState");
  const errorMessage = document.getElementById("valueErrorMessage");

  const skeletonCount = 9;

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function readStoredList() {
    try {
      const raw = localStorage.getItem("valuevaultx:selectedList");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function ensureArrayOfStrings(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item == null) return "";
        return String(item).trim();
      })
      .filter((item) => item.length);
  }

  function sanitizeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const parsed = new URL(value, window.location.origin);
      return parsed.href;
    } catch (error) {
      return "";
    }
  }

  function sanitizeMetadata(raw) {
    if (!raw) return null;
    const fieldNames = ensureArrayOfStrings(raw.fieldNames);
    const fieldIds = ensureArrayOfStrings(raw.fieldIds);
    const fieldCount = Math.min(fieldNames.length, fieldIds.length);

    if (!fieldCount) {
      return null;
    }

    return {
      name: typeof raw.name === "string" && raw.name.trim().length ? raw.name.trim() : "Value list",
      description:
        typeof raw.description === "string" && raw.description.trim().length
          ? raw.description.trim()
          : "Discover the latest trading intel from ValueVaultX.",
      background: sanitizeUrl(raw.background),
      icon: sanitizeUrl(raw.icon),
      api: sanitizeUrl(raw.api),
      fieldNames: fieldNames.slice(0, fieldCount),
      fieldIds: fieldIds.slice(0, fieldCount),
    };
  }

  function formatValue(value) {
    if (value == null) return "—";
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "string") return value.trim() || "—";
    if (Array.isArray(value)) {
      const joined = value
        .map((item) => (typeof item === "string" ? item.trim() : String(item)))
        .join(", ");
      return joined.length ? joined : "—";
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return "—";
      }
    }
    return String(value);
  }

  function renderSkeletons() {
    grid.innerHTML = "";
    errorState.hidden = true;
    emptyState.hidden = true;
    for (let i = 0; i < skeletonCount; i += 1) {
      const article = document.createElement("article");
      article.className = "value-card value-card--skeleton";

      const art = document.createElement("div");
      art.className = "value-card__media";

      const artBox = document.createElement("div");
      artBox.className = "skeleton-box skeleton-box--image";
      art.appendChild(artBox);
      article.appendChild(art);

      const body = document.createElement("div");
      body.className = "value-card__body";

      const title = document.createElement("div");
      title.className = "skeleton-box skeleton-box--title";
      body.appendChild(title);

      const badge = document.createElement("div");
      badge.className = "skeleton-box skeleton-box--chip";
      body.appendChild(badge);

      for (let j = 0; j < 3; j += 1) {
        const stat = document.createElement("div");
        stat.className = "skeleton-box skeleton-box--stat";
        body.appendChild(stat);
      }

      article.appendChild(body);
      grid.appendChild(article);
    }
  }

  function clearSkeletons() {
    const skeletons = grid.querySelectorAll(".value-card--skeleton");
    if (skeletons.length) {
      skeletons.forEach((node) => node.remove());
    }
  }

  function createFilterChip(label, value, isActive) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "value-filter";
    button.textContent = label;
    button.dataset.value = value;
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    if (isActive) {
      button.classList.add("value-filter--active");
    }
    button.addEventListener("click", () => {
      if (state.activeCategory === value) return;
      state.activeCategory = value;
      applyFilters();
    });
    return button;
  }

  function renderFilters() {
    filtersContainer.innerHTML = "";
    if (!state.categories.length) {
      filtersContainer.setAttribute("aria-hidden", "true");
      filtersContainer.hidden = true;
      return;
    }

    filtersContainer.removeAttribute("aria-hidden");
    filtersContainer.hidden = false;
    const categories = ["all", ...state.categories];
    categories.forEach((category) => {
      const isAll = category === "all";
      const label = isAll ? "All" : category;
      const chip = createFilterChip(label, category, state.activeCategory === category);
      filtersContainer.appendChild(chip);
    });
  }

  function updateHero(meta) {
    heroTitle.textContent = meta.name;
    heroDescription.textContent = meta.description;

    if (meta.background) {
      heroBackground.style.backgroundImage = `url('${meta.background}')`;
    } else {
      heroBackground.style.backgroundImage = "";
    }

    if (meta.icon && heroIcon) {
      heroIcon.src = meta.icon;
      heroIcon.alt = `${meta.name} icon`;
      heroIcon.loading = "lazy";
      heroIcon.hidden = false;
      if (heroIconFallback) {
        heroIconFallback.textContent = "";
        heroIconFallback.hidden = true;
      }
      if (heroIconWrap) {
        heroIconWrap.hidden = false;
      }
    } else if (heroIcon) {
      heroIcon.hidden = true;
      heroIcon.removeAttribute("src");
      if (heroIconFallback) {
        const initial = meta.name ? meta.name.charAt(0).toUpperCase() : "?";
        heroIconFallback.textContent = initial;
        heroIconFallback.hidden = false;
      }
      if (heroIconWrap) {
        heroIconWrap.hidden = false;
      }
    }

    if (meta.background) {
      heroArt.style.backgroundImage = `url('${meta.background}')`;
    } else {
      heroArt.style.backgroundImage = "";
    }
  }

  function summarizeUpdatedTimestamp() {
    if (!state.entries.length) {
      heroUpdated.textContent = "—";
      return;
    }

    const timestamps = state.entries
      .map((entry) => {
        const raw = entry.raw.updatedAt || entry.raw.lastUpdated || entry.raw.updated || null;
        if (!raw) return null;
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      })
      .filter(Boolean);

    if (!timestamps.length) {
      heroUpdated.textContent = "Recently";
      return;
    }

    timestamps.sort((a, b) => b.getTime() - a.getTime());
    heroUpdated.textContent = timestamps[0].toLocaleString();
  }

  function createEntry(raw, index) {
    const fields = state.metadata.fieldIds.map((id, position) => {
      const label = state.metadata.fieldNames[position] || id;
      const value = raw ? raw[id] : undefined;
      return {
        id,
        label,
        rawValue: value,
        displayValue: formatValue(value),
      };
    });

    const [nameField, categoryField, imageField, ...extraFields] = fields;

    const entryName = nameField ? nameField.displayValue || nameField.rawValue : null;
    const fallbackName = entryName && typeof entryName === "string" && entryName.trim().length
      ? entryName.trim()
      : `Item ${index + 1}`;

    const categoryValue = categoryField ? categoryField.displayValue : "Uncategorized";
    const normalizedCategory =
      typeof categoryValue === "string" && categoryValue.trim().length
        ? categoryValue.trim()
        : "Uncategorized";
    const imageValue = imageField ? imageField.rawValue || imageField.displayValue : null;

    return {
      raw,
      name: fallbackName,
      category: normalizedCategory,
      image: sanitizeUrl(typeof imageValue === "string" ? imageValue : ""),
      extras: extraFields,
      fields,
    };
  }

  function renderEntryCard(entry) {
    const article = document.createElement("article");
    article.className = "value-card";
    article.setAttribute("role", "listitem");

    if (entry.image) {
      const media = document.createElement("div");
      media.className = "value-card__media";
      const img = document.createElement("img");
      img.src = entry.image;
      img.alt = `${entry.name} preview`;
      img.loading = "lazy";
      media.appendChild(img);
      article.appendChild(media);
    }

    const body = document.createElement("div");
    body.className = "value-card__body";

    const header = document.createElement("div");
    header.className = "value-card__header";

    const title = document.createElement("h3");
    title.textContent = entry.name;
    header.appendChild(title);

    const category = document.createElement("span");
    category.className = "value-card__category";
    category.textContent = entry.category;
    header.appendChild(category);

    body.appendChild(header);

    if (entry.extras.length) {
      const stats = document.createElement("dl");
      stats.className = "value-card__stats";

      entry.extras.forEach((field) => {
        if (!field) return;
        const stat = document.createElement("div");
        stat.className = "value-card__stat";

        const term = document.createElement("dt");
        term.textContent = field.label;
        stat.appendChild(term);

        const value = document.createElement("dd");
        value.textContent = field.displayValue;
        stat.appendChild(value);

        const labelLower = String(field.label || "").toLowerCase();
        if (labelLower.includes("status")) {
          stat.classList.add("value-card__stat--status");
          const valueLower = String(field.displayValue || "").toLowerCase();
          if (valueLower.includes("rising") || valueLower.includes("increasing") || valueLower.includes("up")) {
            stat.classList.add("value-card__stat--positive");
          } else if (
            valueLower.includes("fall") ||
            valueLower.includes("dropping") ||
            valueLower.includes("declin")
          ) {
            stat.classList.add("value-card__stat--negative");
          }
        }

        stats.appendChild(stat);
      });

      body.appendChild(stats);
    } else {
      const placeholder = document.createElement("p");
      placeholder.className = "value-card__empty";
      placeholder.textContent = "More metrics coming soon.";
      body.appendChild(placeholder);
    }
    article.appendChild(body);

    return article;
  }

  function renderEntries(list) {
    grid.innerHTML = "";
    errorState.hidden = true;
    if (!list.length) {
      if (state.entries.length) {
        emptyState.hidden = false;
      } else {
        emptyState.hidden = true;
      }
      return;
    }

    emptyState.hidden = true;
    list.forEach((entry) => {
      grid.appendChild(renderEntryCard(entry));
    });
  }

  function updateCounts() {
    const total = state.entries.length;
    const visible = state.filtered.length;
    heroEntries.textContent = total.toString();

    if (!total) {
      resultsCount.textContent = "No items available yet.";
      heroUpdated.textContent = "—";
      return;
    }

    if (visible === total) {
      resultsCount.textContent = `Showing all ${total} items`;
    } else {
      resultsCount.textContent = `Showing ${visible} of ${total} items`;
    }
  }

  function applyFilters() {
    errorState.hidden = true;
    if (state.isLoading && !state.entries.length) {
      resultsCount.textContent = "Loading entries…";
      return;
    }
    if (!state.entries.length) {
      state.filtered = [];
      renderEntries([]);
      updateCounts();
      return;
    }

    let filtered = [...state.entries];
    const query = state.query.trim().toLowerCase();

    if (state.activeCategory !== "all") {
      filtered = filtered.filter((entry) => {
        return String(entry.category).toLowerCase() === state.activeCategory.toLowerCase();
      });
    }

    if (query) {
      filtered = filtered.filter((entry) => {
        const haystack = [
          entry.name,
          entry.category,
          ...entry.extras.map((field) => field.displayValue),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    state.filtered = filtered;
    renderFilters();
    renderEntries(filtered);
    updateCounts();
    summarizeUpdatedTimestamp();
  }

  function parseEntries(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.records)) return payload.records;

    const firstArray = Object.values(payload).find((value) => Array.isArray(value));
    if (Array.isArray(firstArray)) {
      return firstArray;
    }

    return [];
  }

  async function fetchEntries(url) {
    if (!url) {
      throw new Error("Missing value list API link.");
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async function fetchMetadataBySlug(slug) {
    try {
      const response = await fetch(MASTER_API_ENDPOINT, {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!response.ok) return null;
      const payload = await response.json();
      if (!Array.isArray(payload)) return null;

      const match = payload
        .map((entry) => {
          return {
            name: entry.valueListName,
            description: entry.seoDescription,
            background: entry.gameBackground,
            icon: entry.gameIcon,
            api: entry.valueListApi,
            fieldNames: entry.fieldNames,
            fieldIds: entry.fieldIds,
          };
        })
        .find((entry) => slugify(String(entry.name || "")) === slug);

      return sanitizeMetadata(match);
    } catch (error) {
      return null;
    }
  }

  function showFatalError(message) {
    placeholder.querySelector("h2").textContent = "We couldn’t open this value list.";
    placeholder.querySelector("p").textContent = message;
    placeholder.hidden = false;
    page.hidden = true;
  }

  function showPage() {
    placeholder.hidden = true;
    page.hidden = false;
  }

  function handleError(error) {
    clearSkeletons();
    errorMessage.textContent = error.message || "Something went wrong. Please try again.";
    errorState.hidden = false;
    emptyState.hidden = true;
    resultsCount.textContent = "Unable to load items.";
    heroEntries.textContent = "0";
    heroUpdated.textContent = "—";
  }

  async function loadEntries() {
    if (!state.metadata) return;
    state.isLoading = true;
    errorState.hidden = true;
    emptyState.hidden = true;
    resultsCount.textContent = "Loading entries…";
    renderSkeletons();

    try {
      const payload = await fetchEntries(state.metadata.api);
      const rawEntries = parseEntries(payload);
      state.entries = rawEntries.map((entry, index) => createEntry(entry, index));
      state.categories = Array.from(
        new Set(
          state.entries
            .map((entry) => String(entry.category || "").trim())
            .filter((category) => category.length)
        )
      );
      state.categories.sort((a, b) => a.localeCompare(b));
      if (
        state.activeCategory !== "all" &&
        !state.categories.some((category) => category.toLowerCase() === state.activeCategory.toLowerCase())
      ) {
        state.activeCategory = "all";
      }
      state.isLoading = false;
      clearSkeletons();
      errorState.hidden = true;
      applyFilters();
    } catch (error) {
      state.entries = [];
      state.filtered = [];
      state.categories = [];
      handleError(error);
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

    if (clearSearchButton) {
      clearSearchButton.addEventListener("click", () => {
        if (!searchInput) return;
        searchInput.value = "";
        state.query = "";
        applyFilters();
        searchInput.focus();
      });
    }

    if (resetFiltersButton) {
      resetFiltersButton.addEventListener("click", () => {
        state.activeCategory = "all";
        state.query = "";
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        applyFilters();
      });
    }

    if (retryButton) {
      retryButton.addEventListener("click", () => {
        if (state.isLoading) return;
        loadEntries();
      });
    }
  }

  function updateDocumentMeta(meta) {
    document.title = `ValueVaultX | ${meta.name}`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", meta.description);
    }
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get("list");
    const stored = sanitizeMetadata(readStoredList());

    if (slugParam && stored && slugify(stored.name) !== slugParam) {
      state.metadata = await fetchMetadataBySlug(slugParam);
    } else {
      state.metadata = stored;
    }

    if (!state.metadata && slugParam) {
      state.metadata = await fetchMetadataBySlug(slugParam);
    }

    if (!state.metadata) {
      showFatalError("Return to the home page and choose a value list to reload the data.");
      return;
    }

    if (slugParam) {
      const metaSlug = slugify(state.metadata.name);
      if (metaSlug !== slugParam) {
        showFatalError("This link looks outdated. Open the value list from the home page to refresh it.");
        return;
      }
    }

    if (!state.metadata.api) {
      showFatalError("This value list is missing its data source. Please try again later.");
      return;
    }

    updateDocumentMeta(state.metadata);
    updateHero(state.metadata);
    showPage();
    attachEvents();
    await loadEntries();
  }

  init();
})();
