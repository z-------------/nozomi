#!/usr/bin/env node

const path = require("path");
const loadConfig = require("../lib/loadConfig");
const extract = require("../server/extract");
const list = require("../server/list");

// function extract(a, b) {
//     console.log(a, b);
//     return new Promise(resolve => {
//         setTimeout(resolve, Math.round(Math.random() * 5000));
//     });
// }

// function die(msg, status = 1) {
//     console.error(msg);
//     process.exit(status);
// }

function removeExt(filename) {
    return path.parse(filename).name;
}

function checkCounts(counts) {
    return counts.done < counts.total && counts.current < counts.max;
}

async function doOne(filesLeft, skipList, counts) {
    const filename = filesLeft.pop();

    ++counts.current;
    if (skipList.includes(removeExt(filename))) {
        console.log(`Skipping '${filename}'.`);
    } else {
        await extract(path.join(config["video_dir"], filename), config["sub_dir"]);
    }
    --counts.current;
    ++counts.done;
    console.log(`Done ${counts.done}/${counts.total} (${Math.floor(counts.done / counts.total * 100)}%)`);
    if (checkCounts(counts)) {
        doOne(filesLeft, skipList, counts);
    }
}

const config = loadConfig();

const maxCount = Number(process.argv[2] || 1);

(async () => {
    const filesLeftList = await list(config["video_dir"]);
    const skipList = (await list(config["sub_dir"])).map(removeExt);

    const counts = {
        total: filesLeftList.length,
        max: maxCount,
        done: 0,
        current: 0,
    };

    while (checkCounts(counts)) {
        doOne(filesLeftList, skipList, counts);
    }
})();
