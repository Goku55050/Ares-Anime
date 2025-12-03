/* ===========================================================
   LOAD ANIME DATA
   =========================================================== */
let animeList = [];

async function loadAnimeData() {
  try {
    const res = await fetch("animeData.json?nocache=" + Date.now());
    animeList = await res.json();
    initPage();
  } catch (err) {
    console.error("Error loading animeData.json:", err);
  }
}

/* Start loading immediately */
loadAnimeData();

/* ===========================================================
   PAGE ROUTER
   =========================================================== */
function initPage() {
  const page = document.body.dataset.page;

  switch (page) {
    case "home": initHomePage(); break;
    case "browse": initBrowsePage(); break;
    case "episodes": initEpisodesPage(); break;
    case "watch": initWatchPage(); break;
    case "download": initDownloadPage(); break;
    case "admin": initAdminPage(); break;
  }
}

/* ===========================================================
   HOME PAGE (index.html)
   =========================================================== */
function initHomePage() {
  if (!animeList.length) return;

  // HERO
  renderHeroBanner();

  // SECTIONS
  renderHomeSections();
}

function renderHeroBanner() {
  const heroTitle = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const heroTags = document.getElementById("hero-tags");
  const heroPoster = document.getElementById("hero-poster");
  const heroBtn = document.getElementById("hero-watch-btn");

  // Most popular anime
  const heroAnime = [...animeList].sort((a, b) => b.popularity - a.popularity)[0];
  if (!heroAnime) return;

  heroTitle.textContent = heroAnime.title;
  heroSubtitle.textContent = heroAnime.description || "";
  heroPoster.src = heroAnime.poster || "";
  heroTags.textContent = "Hindi Dub • Updated";

  heroBtn.onclick = () => {
    location.href = `episodes.html?id=${heroAnime.id}`;
  };
}

function renderHomeSections() {
  renderHomeRow("latest-row", [...animeList].sort((a, b) => b.updated - a.updated));
  renderHomeRow("popular-row", [...animeList].sort((a, b) => b.popularity - a.popularity));
  renderHomeRow("trending-row", [...animeList].sort((a, b) => b.trending - a.trending));
}

function renderHomeRow(id, list) {
  const row = document.getElementById(id);
  if (!row) return;

  row.innerHTML = "";

  list.forEach(a => {
    row.innerHTML += `
      <div class="anime-card" onclick="location.href='episodes.html?id=${a.id}'">
        <img src="${a.poster}">
        <div class="card-title">${a.title}</div>
      </div>
    `;
  });
}

/* ===========================================================
   BROWSE PAGE (browse.html)
   =========================================================== */
function initBrowsePage() {
  const grid = document.getElementById("browse-list");
  const search = document.getElementById("browse-search-input");
  if (!grid) return;

  // initial
  renderBrowse(animeList);

  search.addEventListener("input", () => {
    const q = search.value.toLowerCase();
    const filtered = animeList.filter(a =>
      a.title.toLowerCase().includes(q)
    );
    renderBrowse(filtered);
  });
}

function renderBrowse(list) {
  const grid = document.getElementById("browse-list");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach(a => {
    grid.innerHTML += `
      <div class="browse-card" onclick="location.href='episodes.html?id=${a.id}'">
        <img src="${a.poster}">
        <h3>${a.title}</h3>
      </div>
    `;
  });
}

/* ===========================================================
   EPISODES PAGE (episodes.html)
   =========================================================== */
function initEpisodesPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) return;

  const anime = animeList.find(a => a.id === id);
  if (!anime) return;

  // set header info
  document.getElementById("anime-title").textContent = anime.title;
  document.getElementById("anime-description").textContent = anime.description;
  document.getElementById("anime-poster").src = anime.poster;

  const seasonSelect = document.getElementById("season-select");
  seasonSelect.innerHTML = "";

  anime.seasons.forEach((s, i) => {
    seasonSelect.innerHTML += `<option value="${i}">${s.name}</option>`;
  });

  seasonSelect.onchange = () =>
    renderEpisodes(anime, parseInt(seasonSelect.value));

  renderEpisodes(anime, 0);
}

function renderEpisodes(anime, sIndex) {
  const list = document.getElementById("episode-list");
  list.innerHTML = "";

  anime.seasons[sIndex].episodes.forEach(ep => {
    list.innerHTML += `
      <div class="episode-card">
        <div>
          <h3>${ep.title}</h3>
          <p>Episode ${ep.number}</p>
        </div>
        <button class="btn-primary"
          onclick="location.href='watch.html?id=${anime.id}&s=${sIndex}&e=${ep.number}'">
          Watch
        </button>
      </div>
    `;
  });
}
/* ===========================================================
   WATCH PAGE (watch.html)
   =========================================================== */
function initWatchPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const s = parseInt(params.get("s"));
  const e = parseInt(params.get("e"));

  const anime = animeList.find(a => a.id === id);
  if (!anime) return;

  const season = anime.seasons[s];
  if (!season) return;

  const ep = season.episodes.find(x => x.number === e);
  if (!ep) return;

  // META
  document.getElementById("watch-title").textContent = `${anime.title} – Episode ${e}`;
  document.getElementById("watch-subtitle").textContent = season.name;

  // SERVERS
  const serverList = document.getElementById("server-list");
  serverList.innerHTML = "";

  ep.stream_servers.forEach((srv, idx) => {
    serverList.innerHTML += `
      <button class="btn-primary small-btn" onclick="loadServer('${srv.url}')">
        ${srv.name}
      </button>
    `;
  });

  // Load first server by default
  if (ep.stream_servers[0]) {
    loadServer(ep.stream_servers[0].url);
  }

  // NEXT & PREV
  const nextBtn = document.getElementById("next-ep");
  const prevBtn = document.getElementById("prev-ep");

  prevBtn.onclick = () => {
    if (e > 1) {
      location.href = `watch.html?id=${id}&s=${s}&e=${e - 1}`;
    }
  };

  nextBtn.onclick = () => {
    const epCount = season.episodes.length;
    if (e < epCount) {
      location.href = `watch.html?id=${id}&s=${s}&e=${e + 1}`;
    }
  };

  // DOWNLOAD button redirect
  document.getElementById("download-btn").onclick = () => {
    location.href = `download.html?id=${id}&s=${s}&e=${e}`;
  };
}

function loadServer(url) {
  document.getElementById("video-player").src = url;
}


/* ===========================================================
   DOWNLOAD PAGE (download.html)
   =========================================================== */
function initDownloadPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const s = parseInt(params.get("s"));
  const e = parseInt(params.get("e"));

  const anime = animeList.find(a => a.id === id);
  if (!anime) return;

  const season = anime.seasons[s];
  const ep = season.episodes.find(x => x.number === e);

  document.getElementById("download-title").textContent =
    `${anime.title} – Episode ${e}`;
  document.getElementById("download-subtitle").textContent =
    season.name;

  const buttonsBox = document.getElementById("download-buttons");
  buttonsBox.innerHTML = "";

  ep.download_servers.forEach(srv => {
    buttonsBox.innerHTML += `
      <a class="btn-primary" href="${srv.url}" target="_blank">${srv.name}</a>
    `;
  });

  startCountdown();
}

function startCountdown() {
  let sec = 10;
  const timer = document.getElementById("download-timer");
  const box = document.getElementById("download-buttons");

  const tick = setInterval(() => {
    sec--;
    timer.textContent = `Please wait ${sec} seconds…`;

    if (sec <= 0) {
      clearInterval(tick);
      timer.style.display = "none";
      box.style.display = "block";
    }
  }, 1000);
}


/* ===========================================================
   ADMIN PAGE (admin.html)
   =========================================================== */
let adminAnimeData = [];

function initAdminPage() {
  adminAnimeData = animeList;

  fillAnimeDropdowns();
}

function fillAnimeDropdowns() {
  const sel1 = document.getElementById("season-anime-select");
  const sel2 = document.getElementById("episode-anime-select");

  sel1.innerHTML = "";
  sel2.innerHTML = "";

  adminAnimeData.forEach(a => {
    sel1.innerHTML += `<option value="${a.id}">${a.title}</option>`;
    sel2.innerHTML += `<option value="${a.id}">${a.title}</option>`;
  });

  updateEpisodeSeasonDropdown();
}

function updateEpisodeSeasonDropdown() {
  const animeId = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === animeId);

  const seasonSel = document.getElementById("episode-season-select");
  seasonSel.innerHTML = "";

  if (!anime) return;

  anime.seasons.forEach((s, i) => {
    seasonSel.innerHTML += `<option value="${i}">${s.name}</option>`;
  });
}


/* ===========================================================
   ADD ANIME
   =========================================================== */
function addAnime() {
  const title = document.getElementById("anime-title").value;
  const id = document.getElementById("anime-id").value;
  const poster = document.getElementById("anime-poster").value;
  const desc = document.getElementById("anime-description").value;

  if (!title || !id) {
    alert("Title and ID required!");
    return;
  }

  adminAnimeData.push({
    id,
    title,
    poster,
    description: desc,
    popularity: 0,
    trending: 0,
    updated: Date.now(),
    seasons: []
  });

  alert("Anime Added!");
  fillAnimeDropdowns();
}


/* ===========================================================
   ADD SEASON
   =========================================================== */
function addSeason() {
  const animeId = document.getElementById("season-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === animeId);

  const name = document.getElementById("season-name").value;

  if (!name) {
    alert("Season name required.");
    return;
  }

  anime.seasons.push({
    name,
    episodes: []
  });

  alert("Season Added!");
  fillAnimeDropdowns();
}

/* ===========================================================
   ADD EPISODE
   =========================================================== */
function addEpisode() {
  const animeId = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === animeId);

  const sIndex = parseInt(document.getElementById("episode-season-select").value);

  const epNum = parseInt(document.getElementById("ep-number").value);
  const epTitle = document.getElementById("ep-title").value;

  const filemoon = document.getElementById("stream-filemoon").value;
  const streamtape = document.getElementById("stream-streamtape").value;
  const streamgh = document.getElementById("stream-streamgh").value;

  const dl_filemoon = document.getElementById("dl-filemoon").value;
  const dl_streamgh = document.getElementById("dl-streamgh").value;

  if (!epNum || !epTitle) {
    alert("Episode number & title required!");
    return;
  }

  anime.seasons[sIndex].episodes.push({
    number: epNum,
    title: epTitle,
    stream_servers: [
      ...(filemoon ? [{ name: "Filemoon", url: filemoon }] : []),
      ...(streamtape ? [{ name: "StreamTape", url: streamtape }] : []),
      ...(streamgh ? [{ name: "StreamGH", url: streamgh }] : [])
    ],
    download_servers: [
      ...(dl_filemoon ? [{ name: "Filemoon DL", url: dl_filemoon }] : []),
      ...(dl_streamgh ? [{ name: "StreamGH DL", url: dl_streamgh }] : [])
    ]
  });

  alert("Episode Added!");
}


/* ===========================================================
   SAVE TO GITHUB
   =========================================================== */
async function saveToGitHub() {
  const owner = document.getElementById("github-owner").value;
  const repo = document.getElementById("github-repo").value;
  const branch = document.getElementById("github-branch").value;
  const filePath = document.getElementById("github-file-path").value;
  const token = document.getElementById("github-token").value;

  if (!owner || !repo || !token) {
    alert("GitHub details missing!");
    return;
  }

  const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // GET existing file SHA
  const getRes = await fetch(apiURL, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const getData = await getRes.json();
  const sha = getData.sha;

  // Encode new JSON
  const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(adminAnimeData, null, 2))));

  // PUT request to overwrite file
  const putRes = await fetch(apiURL, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Updated animeData via Ares Admin",
      content: newContent,
      sha,
      branch
    })
  });

  if (putRes.ok) {
    alert("Uploaded to GitHub! Vercel will auto-deploy.");
  } else {
    alert("GitHub upload failed.");
  }
}
