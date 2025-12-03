/* ===========================================================
   GLOBAL VARIABLES
=========================================================== */
let animeData = [];
let heroIndex = 0;
let autoSlideInterval = null;
let isDragging = false;
let startX = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let currentSlide = 0;

/* ===========================================================
   LOAD ANIME DATA
=========================================================== */
async function loadAnimeData() {
    try {
        const res = await fetch("animeData.json?noCache=" + Date.now());
        animeData = await res.json();
        initPage();
    } catch (err) {
        console.error("Failed to load animeData.json", err);
    }
}

/* Start loading instantly */
loadAnimeData();

/* ===========================================================
   PAGE ROUTER
=========================================================== */
function initPage() {
    const page = document.body.dataset.page;

    if (document.getElementById("heroTrack")) loadHeroSlides();

    switch (page) {
        case "home":
            loadSectionRows();
            break;

        case "episodes":
            loadEpisodesPage();
            break;

        case "watch":
            loadWatchPage();
            break;

        case "download":
            loadDownloadPage();
            break;

        case "browse":
            loadBrowsePage();
            break;

        case "admin":
            loadAdminPage();
            break;
    }
}

/* ===========================================================
   HOME PAGE SECTIONS (Latest / Popular / Trending)
=========================================================== */
function loadSectionRows() {
    const latest = [...animeData].sort((a, b) => b.updated - a.updated);
    const popular = [...animeData].sort((a, b) => b.popularity - a.popularity);
    const trending = [...animeData].sort((a, b) => b.trending - a.trending);

    fillAnimeRow("latestContainer", latest);
    fillAnimeRow("popularContainer", popular);
    fillAnimeRow("trendingContainer", trending);
}

function fillAnimeRow(id, list) {
    const row = document.getElementById(id);
    row.innerHTML = "";

    list.forEach(item => {
        row.innerHTML += `
        <div class="anime-card" onclick="location.href='episodes.html?id=${item.id}'">
            <img src="${item.poster}" alt="${item.title}">
            <div class="anime-title">${item.title}</div>
        </div>`;
    });
}

/* ===========================================================
   HERO SLIDER (Auto + Swipe)
=========================================================== */
function loadHeroSlides() {
    const heroTrack = document.getElementById("heroTrack");
    heroTrack.innerHTML = "";

    animeData.slice(0, 5).forEach((a) => {
        heroTrack.innerHTML += `
        <div class="hero-slide">
            <img src="${a.poster}">
            <div class="hero-overlay">
                <span class="hero-tag">Hindi Dub • Updated</span>
                <h1 class="hero-title">${a.title}</h1>
                <a href="episodes.html?id=${a.id}" class="hero-btn">Watch Now</a>
            </div>
        </div>`;
    });

    setupHeroSlider();
}

/* ===========================================================
   HERO SLIDER ENGINE (SWIPE + AUTO)
=========================================================== */
function setupHeroSlider() {
    const track = document.getElementById("heroTrack");
    const slides = document.querySelectorAll(".hero-slide");

    currentSlide = 0;
    updateHeroPosition();

    /* Auto-slide every 6s */
    autoSlideInterval = setInterval(() => {
        nextHeroSlide();
    }, 6000);

    /* BUTTON NAVIGATION */
    document.getElementById("heroNext").onclick = nextHeroSlide;
    document.getElementById("heroPrev").onclick = prevHeroSlide;

    /* MOBILE SWIPE */
    track.addEventListener("touchstart", startSwipe);
    track.addEventListener("touchmove", moveSwipe);
    track.addEventListener("touchend", endSwipe);

    /* DESKTOP DRAG */
    track.addEventListener("mousedown", startSwipe);
    track.addEventListener("mousemove", moveSwipe);
    track.addEventListener("mouseup", endSwipe);
    track.addEventListener("mouseleave", endSwipe);
}

function updateHeroPosition() {
    const track = document.getElementById("heroTrack");
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function nextHeroSlide() {
    const slides = document.querySelectorAll(".hero-slide");
    currentSlide = (currentSlide + 1) % slides.length;
    updateHeroPosition();
}

function prevHeroSlide() {
    const slides = document.querySelectorAll(".hero-slide");
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateHeroPosition();
}

/* -------------------- SWIPE HANDLERS -------------------- */
function startSwipe(e) {
    clearInterval(autoSlideInterval);
    isDragging = true;
    startX = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
}

function moveSwipe(e) {
    if (!isDragging) return;
    e.preventDefault();

    let currentX = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
    let diff = startX - currentX;

    /* threshold */
    if (Math.abs(diff) > 50) {
        if (diff > 0) nextHeroSlide();
        else prevHeroSlide();

        isDragging = false;
        autoSlideInterval = setInterval(nextHeroSlide, 6000);
    }
}

function endSwipe() {
    isDragging = false;
}

/* ===========================================================
   EPISODES PAGE
=========================================================== */
function loadEpisodesPage() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    const anime = animeData.find(a => a.id === id);
    if (!anime) return;

    document.getElementById("animeTitle").textContent = anime.title;
    document.getElementById("animeDescription").textContent = anime.description;
    document.getElementById("episodePoster").src = anime.poster;

    const select = document.getElementById("seasonSelect");
    select.innerHTML = "";

    anime.seasons.forEach((s, i) => {
        select.innerHTML += `<option value="${i}">${s.name}</option>`;
    });

    select.onchange = () => renderEpisodes(anime, select.value);

    renderEpisodes(anime, 0);
}

function renderEpisodes(anime, seasonIndex) {
    const container = document.getElementById("episodesList");
    container.innerHTML = "";

    anime.seasons[seasonIndex].episodes.forEach(ep => {
        container.innerHTML += `
        <div class="episode-card">
            <div>
                <h3>${ep.title}</h3>
                <p>Episode ${ep.number}</p>
            </div>
            <button class="btn-primary"
                onclick="location.href='watch.html?id=${anime.id}&s=${seasonIndex}&e=${ep.number}'">
                Watch
            </button>
        </div>`;
    });
}

/* ===========================================================
   WATCH PAGE
=========================================================== */
function loadWatchPage() {
    const p = new URLSearchParams(location.search);
    const id = p.get("id");
    const s = parseInt(p.get("s"));
    const e = parseInt(p.get("e"));

    const anime = animeData.find(a => a.id === id);
    if (!anime) return;

    const season = anime.seasons[s];
    const ep = season.episodes.find(x => x.number === e);

    document.getElementById("watchTitle").textContent =
        `${anime.title} — Episode ${e}`;

    const player = document.getElementById("videoPlayer");

    loadStreamServer(ep);

    document.getElementById("prevEpisode").onclick = () => {
        if (e > 1)
            location.href = `watch.html?id=${id}&s=${s}&e=${e - 1}`;
    };

    document.getElementById("nextEpisode").onclick = () => {
        if (e < season.episodes.length)
            location.href = `watch.html?id=${id}&s=${s}&e=${e + 1}`;
    };

    document.getElementById("downloadBtn").href =
        `download.html?id=${id}&s=${s}&e=${e}`;
}

/* Load server based on user dropdown */
function loadStreamServer(ep) {
    const select = document.getElementById("server-choice");

    function updatePlayer() {
        const server = select.value;
        const found = ep.stream_servers.find(s => s.name.toLowerCase().includes(server));
        document.getElementById("videoPlayer").src = found ? found.url : "";
    }

    select.onchange = updatePlayer;
    updatePlayer();
}
/* ===========================================================
   DOWNLOAD PAGE
=========================================================== */
function loadDownloadPage() {
    const p = new URLSearchParams(location.search);
    const id = p.get("id");
    const s = parseInt(p.get("s"));
    const e = parseInt(p.get("e"));

    const anime = animeData.find(a => a.id === id);
    if (!anime) return;

    const season = anime.seasons[s];
    const ep = season.episodes.find(x => x.number === e);

    document.getElementById("downloadTitle").textContent =
        `${anime.title} — Episode ${e}`;
    document.getElementById("downloadSubtitle").textContent = season.name;

    const linksBox = document.getElementById("downloadLinks");
    linksBox.innerHTML = "";

    ep.download_servers.forEach(server => {
        linksBox.innerHTML += `
            <a class="download-btn" href="${server.url}" target="_blank">
                Download (${server.name})
            </a>
        `;
    });

    startDownloadCountdown();
}

function startDownloadCountdown() {
    let time = 10;
    const txt = document.getElementById("countdownText");
    const links = document.getElementById("downloadLinks");

    const timer = setInterval(() => {
        txt.textContent = `Please wait ${time} seconds…`;
        time--;

        if (time < 0) {
            clearInterval(timer);
            txt.style.display = "none";
            links.style.display = "block";
        }
    }, 1000);
}

/* ===========================================================
   BROWSE PAGE – LIVE SEARCH
=========================================================== */
function loadBrowsePage() {
    const input = document.getElementById("browseSearchInput");
    const grid = document.getElementById("browseGrid");

    function render(list) {
        grid.innerHTML = "";
        list.forEach(a => {
            grid.innerHTML += `
                <div class="browse-card" onclick="location.href='episodes.html?id=${a.id}'">
                    <img src="${a.poster}">
                    <div class="browse-title">${a.title}</div>
                </div>
            `;
        });
    }

    render(animeData);

    input.oninput = () => {
        const q = input.value.toLowerCase();
        const filtered = animeData.filter(a =>
            a.title.toLowerCase().includes(q)
        );
        render(filtered);
    };
}

/* ===========================================================
   ADMIN PANEL — LOAD DROPDOWNS
=========================================================== */
function loadAdminPage() {
    const animeSelect1 = document.getElementById("seasonAnimeSelect");
    const animeSelect2 = document.getElementById("episodeAnimeSelect");

    animeData.forEach(a => {
        animeSelect1.innerHTML += `<option value="${a.id}">${a.title}</option>`;
        animeSelect2.innerHTML += `<option value="${a.id}">${a.title}</option>`;
    });

    adminUpdateSeasonList();
}

/* Season dropdown update when selecting anime */
function adminUpdateSeasonList() {
    const animeId = document.getElementById("episodeAnimeSelect").value;
    const anime = animeData.find(a => a.id === animeId);
    const seasonSelect = document.getElementById("episodeSeasonSelect");

    seasonSelect.innerHTML = "";

    anime.seasons.forEach((s, i) => {
        seasonSelect.innerHTML += `<option value="${i}">${s.name}</option>`;
    });
}

/* ===========================================================
   ADMIN — ADD ANIME
=========================================================== */
function adminAddAnime() {
    const title = document.getElementById("animeTitle").value;
    const id = document.getElementById("animeId").value;
    const poster = document.getElementById("animePoster").value;
    const desc = document.getElementById("animeDescription").value;

    if (!title || !id || !poster) {
        alert("Fill all fields!");
        return;
    }

    animeData.push({
        id,
        title,
        poster,
        description: desc,
        popularity: 1,
        trending: 1,
        updated: Date.now(),
        seasons: []
    });

    alert("Anime Added!");
}

/* ===========================================================
   ADMIN — ADD SEASON
=========================================================== */
function adminAddSeason() {
    const animeId = document.getElementById("seasonAnimeSelect").value;
    const seasonName = document.getElementById("seasonName").value;

    if (!seasonName) return alert("Enter season name!");

    const anime = animeData.find(a => a.id === animeId);

    anime.seasons.push({
        name: seasonName,
        episodes: []
    });

    alert("Season Added!");
}

/* ===========================================================
   ADMIN — ADD EPISODE
=========================================================== */
function adminAddEpisode() {
    const animeId = document.getElementById("episodeAnimeSelect").value;
    const anime = animeData.find(a => a.id === animeId);

    const seasonIndex = parseInt(document.getElementById("episodeSeasonSelect").value);

    const epNum = parseInt(document.getElementById("episodeNumber").value);
    const epTitle = document.getElementById("episodeTitle").value;

    const streamFilemoon = document.getElementById("streamFilemoon").value;
    const streamGH = document.getElementById("streamGH").value;
    const streamTape = document.getElementById("streamTape").value;

    const downloadFilemoon = document.getElementById("downloadFilemoon").value;
    const downloadGH = document.getElementById("downloadGH").value;

    anime.seasons[seasonIndex].episodes.push({
        number: epNum,
        title: epTitle,
        stream_servers: [
            { name: "Filemoon", url: streamFilemoon },
            { name: "StreamGH", url: streamGH },
            { name: "StreamTape", url: streamTape }
        ],
        download_servers: [
            { name: "Filemoon", url: downloadFilemoon },
            { name: "StreamGH", url: downloadGH }
        ]
    });

    anime.updated = Date.now();

    alert("Episode Added!");
}

/* ===========================================================
   ADMIN — GITHUB API UPLOAD (REAL PUT REQUEST)
=========================================================== */
async function adminUploadGitHub() {
    const owner = document.getElementById("githubOwner").value;
    const repo = document.getElementById("githubRepo").value;
    const branch = document.getElementById("githubBranch").value;
    const path = document.getElementById("githubPath").value;
    const token = document.getElementById("githubToken").value;

    if (!owner || !repo || !path || !token) {
        alert("Fill all GitHub fields");
        return;
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const getFile = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const fileData = await getFile.json();

    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(animeData, null, 2))));

    const body = {
        message: "Updated animeData.json by Ares Admin",
        content: newContent,
        branch: branch,
        sha: fileData.sha
    };

    const upload = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (upload.status === 200 || upload.status === 201) {
        alert("GitHub Updated Successfully! Vercel will auto-deploy.");
    } else {
        alert("GitHub Upload Failed.");
    }
          }
