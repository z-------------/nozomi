/* global elements */

const statusEl = document.getElementById("status");

const searchTermInput = document.getElementById("search-form-term");
const searchExactInput = document.getElementById("search-form-exact");
const searchButton = document.getElementById("search-form-button");
const searchResultsEl = document.getElementById("search-results");

const renderModeInput = document.getElementById("render-setting-mode");
const renderSubtitlesInput = document.getElementById("render-setting-subtitles");
const renderPositionInput = document.getElementById("render-setting-position");

const renderImageEl = document.getElementById("render-image");
const renderAudioEl = document.getElementById("render-audio");
const renderVideoEl = document.getElementById("render-video");

const extractEl = document.getElementById("section-extract");

/* helper functions */

const status = message => {
    statusEl.textContent = message;
};

const removeExt = basename => basename.split(".")[0];

const removeAllChildren = element => {
    while (element.children.length) {
        element.removeChild(element.children[0]);
    }
};

const formatTimestamp = time => {
    const h = Math.floor(time / 3600);
    const minutes = time % 3600;
    const m = Math.floor(minutes / 60);
    const s = minutes % 60;
    return [
        h.toString().padStart(2, "0"),
        m.toString().padStart(2, "0"),
        s.toFixed(1).padStart(4, "0"),
    ].join(":");
};

const roundPlaces = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

/* extract pane */

function updateExtractPane() {
    return Promise.all([
        fetch("/api/list?type=v").then(body => body.json()),
        fetch("/api/list?type=s").then(body => body.json()),
    ]).then(([videos, subs]) => {
        removeAllChildren(extractEl);

        for (const filename of videos) {
            const name = removeExt(filename);
            const isExtracted = subs.map(filename => removeExt(filename)).includes(name);
    
            const el = document.createElement("div");
            el.classList.add("clickable");
            el.textContent = `${filename}${isExtracted ? " [extracted]" : ""}`;
            el.addEventListener("click", async () => {
                status(`Extracting subs from '${filename}'...`);
                await fetch(`/api/extract?filename=${filename}`);
                status(`Extracted subs from '${filename}'.`);
                updateExtractPane();
            });
            extractEl.appendChild(el);
        }
    });
}

/* search pane */

function makeSearchResultItem(videoName, { text, timeStart, timeEnd }) {
    const element = document.createElement("div");
    element.classList.add("search-result", "clickable");

    element.dataset.filename = videoName + ".mkv";
    element.dataset.timeStart = timeStart;
    element.dataset.timeEnd = timeEnd;
    
    const textEl = document.createElement("span");
    textEl.textContent = text;

    element.append(new Text("\""));
    element.appendChild(textEl);
    element.append(new Text(`" (${formatTimestamp(timeStart)} - ${formatTimestamp(timeEnd)})`));

    element.addEventListener("click", async e => {
        const el = element;

        const times = [el.dataset.timeStart, el.dataset.timeEnd].map(Number);
        let timeStart;
        switch (renderPositionInput.value) {
            case "start":
                timeStart = times[0];
                break;
            case "middle":
                timeStart = roundPlaces((times[0] + times[1]) / 2, 3);
                break;
            case "end":
                timeStart = times[1] - 0.1;
                break;
        }
        let timeEnd = times[1];

        status(`Rendering '${el.dataset.filename}' at ${formatTimestamp(timeStart)}...`);
        await fetchRender(renderModeInput.value, renderSubtitlesInput.checked, el.dataset.filename, [timeStart, timeEnd]);
        status(`Rendered '${el.dataset.filename}' at ${formatTimestamp(timeStart)}.`);
    });

    return element;
}

function listSearchResults(results) {
    removeAllChildren(searchResultsEl);

    for (const key in results) {
        const labelEl = document.createElement("div");
        labelEl.classList.add("search-results-label", "heading");
        labelEl.textContent = key;
        searchResultsEl.appendChild(labelEl);

        for (const result of results[key]) {
            searchResultsEl.appendChild(makeSearchResultItem(key, result));
        }
    }
}

async function handleSearch() {
    const term = searchTermInput.value;
    const exact = searchExactInput.checked;
    
    const results = await fetch(`/api/search?term=${term}&exact=${exact ? "true" : "false"}`)
        .then(body => body.json());
    status(`Performed ${exact ? "" : "non-"}exact search for '${term}'.`);
    listSearchResults(results);
}

searchButton.addEventListener("click", handleSearch);
searchTermInput.addEventListener("keydown", e => {
    if (e.key === "Enter") handleSearch();
});

/* render pane */

function fetchRender(modeStr, includeSubtitles, videoFilename, [timeStart, timeEnd]) {
    const srcUrl = `/api/render?mode=${modeStr}&subtitles=${includeSubtitles ? "true" : "false"}&filename=${videoFilename}&start=${timeStart}&end=${timeEnd}`;
    return new Promise(resolve => {
        const [el, eventName] =
            modeStr === "audio" ?
            [renderAudioEl, "canplaythrough"] :
            modeStr.startsWith("video") ?
            [renderVideoEl, "canplaythrough"] :
            modeStr === "screenshot" ?
            [renderImageEl, "load"] :
            undefined;
        el.removeAttribute("src");
        el[`on${eventName}`] = () => {
            if (["audio", "video"].includes(modeStr)) el.play();
            resolve();
        };
        el.setAttribute("src", srcUrl);
    });
}

/* ready */

status("Ready.");

updateExtractPane();
