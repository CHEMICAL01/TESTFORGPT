(function () {
  const container = document.getElementById("valueDetail");
  const placeholder = document.getElementById("detailPlaceholder");

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

  function buildDetailView(data) {
    container.innerHTML = "";

    const media = document.createElement("div");
    media.className = "value-detail__media";
    if (data.background) {
      const img = document.createElement("img");
      img.src = data.background;
      img.alt = `${data.name} artwork`;
      img.loading = "lazy";
      media.appendChild(img);
    }

    const card = document.createElement("div");
    card.className = "value-detail__card";

    const header = document.createElement("div");
    header.className = "value-detail__header";

    if (data.icon) {
      const icon = document.createElement("img");
      icon.className = "value-detail__icon";
      icon.src = data.icon;
      icon.alt = `${data.name} icon`;
      icon.loading = "lazy";
      header.appendChild(icon);
    } else {
      const iconFallback = document.createElement("div");
      iconFallback.className = "value-detail__icon value-detail__icon--placeholder";
      iconFallback.textContent = data.name ? data.name.charAt(0).toUpperCase() : "?";
      header.appendChild(iconFallback);
    }

    const meta = document.createElement("div");
    meta.className = "value-detail__meta";

    const badge = document.createElement("span");
    badge.textContent = "Value list";
    meta.appendChild(badge);

    const title = document.createElement("h1");
    title.textContent = data.name || "Value list";
    meta.appendChild(title);

    header.appendChild(meta);
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "value-detail__body";

    const description = document.createElement("p");
    description.textContent = data.description || "Dynamic details coming soon.";
    body.appendChild(description);
    card.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "value-detail__actions";

    if (data.api) {
      const apiLink = document.createElement("a");
      apiLink.className = "button button--primary";
      apiLink.href = data.api;
      apiLink.target = "_blank";
      apiLink.rel = "noreferrer";
      apiLink.textContent = "Open API data";
      actions.appendChild(apiLink);
    }

    const homeLink = document.createElement("a");
    homeLink.className = "button button--ghost";
    homeLink.href = "index.html#value-lists";
    homeLink.textContent = "Back to home";
    actions.appendChild(homeLink);

    card.appendChild(actions);

    const note = document.createElement("p");
    note.className = "value-detail__note";
    note.textContent =
      "Dynamic value list rendering will appear here once the secondary API requirements are in place.";
    card.appendChild(note);

    container.appendChild(media);
    container.appendChild(card);
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get("list");
    const stored = readStoredList();

    if (!stored) {
      placeholder.querySelector("h2").textContent = "We couldn't find this value list.";
      placeholder.querySelector("p").textContent =
        "Return to the home page and select a value list so we can load the dynamic data.";
      return;
    }

    if (slugParam) {
      const storedSlug = slugify(stored.name || "");
      if (storedSlug && storedSlug !== slugParam) {
        placeholder.querySelector("h2").textContent = "This link looks out of date.";
        placeholder.querySelector("p").textContent =
          "Try opening the value list again from the home page to refresh the data.";
        return;
      }
    }

    document.title = `ValueVaultX | ${stored.name || "Value list"}`;
    buildDetailView(stored);
  }

  init();
})();
