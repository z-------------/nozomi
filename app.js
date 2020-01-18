const path = require("path");
const fs = require("fs");

const Koa = require("koa");
const send = require("koa-send");
const static = require("koa-static");

const match = require("suitchi");
const loadConfig = require("./lib/loadConfig");
const extract = require("./lib/extract");
const search = require("./lib/search");
const { render, getRenderName, RenderMode } = require("./lib/render");
const list = require("./lib/list");

const isEmpty = require("./lib/isEmpty");

const PORT = 8080;

/* load config */

const config = loadConfig();
console.log("Config:");
for (const key in config) {
    console.log(`\t${key} = ${config[key]}`);
}

/* create output dirs */

for (const key in config) {
    if (!key.endsWith("_dir")) continue;

    if (!fs.existsSync(config[key])) {
        try {
            fs.mkdirSync(config[key]);
        } catch (e) {
            console.error(`Failed to create '${config[key]}':`);
            console.error(e);
        }
    }
}

/* app */

const app = new Koa();

// logger
app.use((ctx, next) => {
    console.log(ctx.method, ctx.path, ... isEmpty(ctx.query) ? [] : [Object.assign({}, ctx.query)]);
    return next();
});

// path splitter
app.use((ctx, next) => {
    ctx.state.path = ctx.path.slice(1).split("/");
    return next();
});

// api
app.use(async (ctx, next) => {
    if (ctx.state.path[0] !== "api") return await next();

    switch (ctx.state.path[1]) {
        case "extract":
            await extract(ctx.query["filename"], config);
            ctx.status = 200;
            break;

        case "search":
            const exact = ctx.query["exact"] ? (ctx.query["exact"] === "true" ? true : false) : false;
            const results = await search(ctx.query["term"], exact, config);
            ctx.body = results;
            break;

        case "render":
            const subtitles = ctx.query["subtitles"] === "true";
            const mode = match(ctx.query["mode"], [
                ["screenshot", RenderMode.Screenshot],
                ["audio", RenderMode.Audio],
                ["video", RenderMode.Video],
            ]);

            const videoFilename = ctx.query["filename"];
            
            const timeStart = Number(ctx.query["start"]);
            const timeEnd = Number(ctx.query["end"]);

            const outName = getRenderName(mode, { subtitles }, videoFilename, [timeStart, timeEnd], config);
            try {
                await fs.promises.stat(path.join(config["render_dir"], outName));
            } catch (e) {
                await render(mode, { subtitles }, videoFilename, [timeStart, timeEnd], outName, config);
            }
            await send(ctx, outName, { root: config["render_dir"] });
            break;

        case "list":
            const type = ctx.query["type"];
            if (!["v", "s"].includes(type)) return ctx.status = 400;
            const dir = type === "v" ? config["video_dir"] : config["sub_dir"];
            ctx.body = await list(dir);
            break;

        default:
            await next();
    }
});

// index redirect
app.use((ctx, next) => {
    if (ctx.path !== "/") return next();
    ctx.redirect("/dashboard/");
});

// static
app.use(static(path.join(__dirname, "public")));

/* start */

app.listen(PORT);
console.log(`Listening on port ${PORT}.`);
