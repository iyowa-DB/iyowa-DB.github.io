let musicData = [];

const els = {
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  searchResultsSection: document.getElementById("searchResultsSection"),
  resultCount: document.getElementById("resultCount"),
  results: document.getElementById("results"),

  albumFilters: document.getElementById("albumFilters"),
  categoryFilters: document.getElementById("categoryFilters"),
  vocalFilters: document.getElementById("vocalFilters"),
  girlFilters: document.getElementById("girlFilters"),
  keyFilters: document.getElementById("keyFilters"),
  timeSignatureFilters: document.getElementById("timeSignatureFilters"),

  albumCards: document.getElementById("albumCards"),
  categoryCards: document.getElementById("categoryCards"),
  vocalCards: document.getElementById("vocalCards"),
  girlCards: document.getElementById("girlCards"),

  tempoOperator: document.getElementById("tempoOperator"),
  tempoValue: document.getElementById("tempoValue"),
  durationOperator: document.getElementById("durationOperator"),
  durationValue: document.getElementById("durationValue"),
  dateOperator: document.getElementById("dateOperator"),
  dateValue: document.getElementById("dateValue"),
  clearFilters: document.getElementById("clearFilters")
};

async function loadMusic() {
  try {
    const response = await fetch("./data/music.json");

    if (!response.ok) {
      throw new Error(`music.json: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("music.json の最上位は配列 [] にしてください。");
    }

    musicData = data;

    buildAllCategoryCards();
    buildAllFilterOptions();

  } catch (error) {
    console.error(error);
    showLoadError(error);
  }
}

function showLoadError(error) {
  const message = document.createElement("p");
  message.className = "empty";
  message.textContent = "曲データを読み込めませんでした。music.jsonを確認してください。";

  els.results.replaceChildren(message);
  els.searchResultsSection.hidden = false;
  els.resultCount.textContent = "";
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "ja"));
}

function countByValue(values) {
  const counts = new Map();

  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return String(a[0]).localeCompare(String(b[0]), "ja");
  });
}

function getNamedCounts(field) {
  const map = new Map();

  for (const music of musicData) {
    for (const item of music[field] || []) {
      if (!item || !item.id) continue;

      if (!map.has(item.id)) {
        map.set(item.id, {
          id: item.id,
          name: item.name || item.id,
          count: 0
        });
      }

      map.get(item.id).count++;
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, "ja");
  });
}

function getAlbumCounts() {
  const map = new Map();
  let unregisteredCount = 0;

  for (const music of musicData) {
    const albums = music.albums || [];

    if (albums.length === 0) {
      unregisteredCount++;
      continue;
    }

    for (const album of albums) {
      if (!album || !album.id) continue;

      if (!map.has(album.id)) {
        map.set(album.id, {
          id: album.id,
          name: album.name || album.id,
          count: 0
        });
      }

      map.get(album.id).count++;
    }
  }

  const result = [...map.values()];

  if (unregisteredCount > 0) {
    result.push({
      id: "__none__",
      name: "アルバム未収録",
      count: unregisteredCount
    });
  }

  return result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, "ja");
  });
}

function getSimpleCounts(field) {
  const values = [];

  for (const music of musicData) {
    for (const value of music[field] || []) {
      values.push(value);
    }
  }

  return countByValue(values).map(([value, count]) => ({
    id: value,
    name: value,
    count
  }));
}

function buildCard(container, item, url) {
  const link = document.createElement("a");
  link.className = "category-card";
  link.href = url;

  const name = document.createElement("span");
  name.className = "category-card-name";
  name.textContent = item.name;

  const count = document.createElement("span");
  count.className = "category-card-count";
  count.textContent = `${item.count}曲`;

  link.append(name, count);
  container.appendChild(link);
}

function buildAllCategoryCards() {
  els.albumCards.replaceChildren();
  els.vocalCards.replaceChildren();
  els.girlCards.replaceChildren();
  els.categoryCards.replaceChildren();

  for (const album of getAlbumCounts()) {
    if (album.id === "__none__") continue;
    buildCard(els.albumCards, album, `./album/?id=${encodeURIComponent(album.id)}`);
  }

  for (const vocal of getSimpleCounts("vocals")) {
    buildCard(els.vocalCards, vocal, `./vocal/?id=${encodeURIComponent(vocal.id)}`);
  }

  for (const girl of getNamedCounts("girls")) {
    buildCard(els.girlCards, girl, `./girl/?id=${encodeURIComponent(girl.id)}`);
  }

  for (const category of getSimpleCounts("categories")) {
    buildCard(els.categoryCards, category, `./category/?id=${encodeURIComponent(category.id)}`);
  }
}

function makeFilterOption(container, group, item) {
  const wrapper = document.createElement("label");
  wrapper.className = "filter-option";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = group;
  input.value = item.id;

  input.addEventListener("change", applyFilters);

  const text = document.createElement("span");
  text.textContent = item.name;

  const count = document.createElement("span");
  count.className = "filter-count";
  count.textContent = `(${item.count})`;

  wrapper.append(input, text, count);
  container.appendChild(wrapper);
}

function buildFilterOptions(container, group, items) {
  container.replaceChildren();

  for (const item of items) {
    makeFilterOption(container, group, item);
  }
}

function buildAllFilterOptions() {
  buildFilterOptions(els.albumFilters, "album", getAlbumCounts());
  buildFilterOptions(els.categoryFilters, "category", getSimpleCounts("categories"));
  buildFilterOptions(els.vocalFilters, "vocal", getSimpleCounts("vocals"));
  buildFilterOptions(els.girlFilters, "girl", getNamedCounts("girls"));
  buildFilterOptions(els.keyFilters, "key", getSimpleCounts("key"));
  buildFilterOptions(
    els.timeSignatureFilters,
    "timeSignature",
    getSimpleCounts("timeSignature")
  );
}

function getCheckedValues(container) {
  return [...container.querySelectorAll("input:checked")]
    .map(input => input.value);
}

function hasSelected(container) {
  return container.querySelector("input:checked") !== null;
}

function includesAny(values, selected) {
  return selected.some(value => values.includes(value));
}

function matchesNumber(values, operator, target) {
  if (values.length === 0) return false;

  return values.some(value => {
    if (operator === "eq") return value === target;
    if (operator === "gte") return value >= target;
    if (operator === "lte") return value <= target;
    return false;
  });
}

function matchesFilters(music) {
  const selectedAlbums = getCheckedValues(els.albumFilters);
  const selectedCategories = getCheckedValues(els.categoryFilters);
  const selectedVocals = getCheckedValues(els.vocalFilters);
  const selectedGirls = getCheckedValues(els.girlFilters);
  const selectedKeys = getCheckedValues(els.keyFilters);
  const selectedTimeSignatures = getCheckedValues(els.timeSignatureFilters);

  if (hasSelected(els.albumFilters)) {
    const albums = music.albums || [];
    const isUnregistered = albums.length === 0;

    const albumMatch = selectedAlbums.some(id =>
      id === "__none__" ? isUnregistered : albums.some(album => album.id === id)
    );

    if (!albumMatch) return false;
  }

  if (hasSelected(els.categoryFilters) &&
      !includesAny(music.categories || [], selectedCategories)) {
    return false;
  }

  if (hasSelected(els.vocalFilters) &&
      !includesAny(music.vocals || [], selectedVocals)) {
    return false;
  }

  if (hasSelected(els.girlFilters)) {
    const girls = (music.girls || []).map(girl => girl.id);
    if (!includesAny(girls, selectedGirls)) return false;
  }

  if (hasSelected(els.keyFilters) &&
      !includesAny(music.key || [], selectedKeys)) {
    return false;
  }

  if (hasSelected(els.timeSignatureFilters) &&
      !includesAny(music.timeSignature || [], selectedTimeSignatures)) {
    return false;
  }

  const tempoValue = Number(els.tempoValue.value);
  if (els.tempoValue.value !== "" &&
      !matchesNumber(music.tempo || [], els.tempoOperator.value, tempoValue)) {
    return false;
  }

  const durationValue = Number(els.durationValue.value);
  if (els.durationValue.value !== "" &&
      !matchesNumber([music.duration].filter(v => typeof v === "number"),
        els.durationOperator.value, durationValue)) {
    return false;
  }

  if (els.dateValue.value) {
    const releaseDate = music.releaseDate || "";
    const targetDate = els.dateValue.value;

    if (els.dateOperator.value === "eq" && releaseDate !== targetDate) {
      return false;
    }

    if (els.dateOperator.value === "lte" && releaseDate > targetDate) {
      return false;
    }

    if (els.dateOperator.value === "gte" && releaseDate < targetDate) {
      return false;
    }
  }

  return true;
}

function matchesSearch(music, query) {
  if (!query) return true;

  const text = [
    music.title,
    music.titleReading,
    music.titleEn,
    music.description,
    music.lyricsStart,
    ...(music.vocals || []),
    ...(music.categories || []),
    ...(music.girls || []).map(girl => girl.name)
  ].filter(Boolean).join(" ");

  return text.toLocaleLowerCase("ja").includes(query.toLocaleLowerCase("ja"));
}

function searchAndFilter() {
  const query = els.searchInput.value.trim();

  const results = musicData.filter(music =>
    matchesSearch(music, query) && matchesFilters(music)
  );

  renderResults(results);

  els.searchResultsSection.hidden = false;
  els.searchResultsSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function applyFilters() {
  const hasAdvancedFilter =
    hasSelected(els.albumFilters) ||
    hasSelected(els.categoryFilters) ||
    hasSelected(els.vocalFilters) ||
    hasSelected(els.girlFilters) ||
    hasSelected(els.keyFilters) ||
    hasSelected(els.timeSignatureFilters) ||
    els.tempoValue.value !== "" ||
    els.durationValue.value !== "" ||
    els.dateValue.value !== "";

  if (!hasAdvancedFilter) return;

  const query = els.searchInput.value.trim();

  const results = musicData.filter(music =>
    matchesSearch(music, query) && matchesFilters(music)
  );

  renderResults(results);
  els.searchResultsSection.hidden = false;
}

function renderResults(results) {
  els.results.replaceChildren();
  els.resultCount.textContent = `${results.length}曲`;

  if (results.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "該当する曲がありません。";
    els.results.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "music-list";

  for (const music of results) {
    const article = document.createElement("article");
    article.className = "music-card";

    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = `./music/?id=${encodeURIComponent(music.id)}`;
    link.textContent = music.title;
    title.appendChild(link);

    const meta = document.createElement("div");
    meta.className = "music-meta";

    const vocal = (music.vocals || []).join(" / ");
    const date = music.releaseDate || "";

    meta.textContent = [date, vocal].filter(Boolean).join(" · ");

    article.append(title, meta);
    list.appendChild(article);
  }

  els.results.appendChild(list);
}

function clearFilters() {
  document.querySelectorAll(".filter-options input[type='checkbox']")
    .forEach(input => input.checked = false);

  els.tempoValue.value = "";
  els.durationValue.value = "";
  els.dateValue.value = "";

  els.searchResultsSection.hidden = true;
  els.results.replaceChildren();
  els.resultCount.textContent = "";
}

els.searchButton.addEventListener("click", searchAndFilter);

els.searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    searchAndFilter();
  }
});

[
  els.tempoValue,
  els.durationValue,
  els.dateValue,
  els.tempoOperator,
  els.durationOperator,
  els.dateOperator
].forEach(element => {
  element.addEventListener("change", applyFilters);
});

els.clearFilters.addEventListener("click", clearFilters);

loadMusic();
