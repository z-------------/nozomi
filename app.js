const path = require("path");
const fs = require("fs");

const Koa = require("koa");
const send = require("koa-send");
const static = require("koa-static");

const loadConfig = require("./lib/loadConfig");
const extract = require("./lib/extract");
const search = require("./lib/search");
const render = require("./lib/render");
const list = require("./lib/list");

const formatTimestamp = require("./lib/formatTimestamp");
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
            await extract(path.join(config["video_dir"], ctx.query["filename"]), config["sub_dir"]);
            ctx.status = 200;
            break;
        case "search":
            const exact = ctx.query["exact"] ? (ctx.query["exact"] === "true" ? true : false) : false;
            const results = await search(ctx.query["term"], exact, config["sub_dir"]);
            ctx.body = results;
            break;
        case "render":
            const videoPath = path.join(config["video_dir"], ctx.query["filename"]);

            const time = Number(ctx.query["time"]);
            const timestamp = formatTimestamp(time);

            const outName = `${path.parse(videoPath).name}-${timestamp.replace(/:/g, "-")}.jpg`;
            try {
                await fs.promises.stat(path.join(config["render_dir"], outName));
            } catch (e) {
                await render(videoPath, config["sub_dir"], time, config["render_dir"], outName);
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
