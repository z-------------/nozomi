const { compile } = require("ass-compiler");
const fs = require("fs").promises;
const path = require("path");

const unexactify = text => text
    .toLowerCase()
    .replace(/[ .,!?&-]/g, "")
    .replace(/\\N/g, "");

const roundPlaces = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

const searchOne = async (filePath, term, exact) => {
    const results = [];
    const file = await fs.readFile(filePath, "utf-8");
    const { dialogues } = compile(file);
    for (const dialog of dialogues) {
        for (const slice of dialog.slices) {
            for (const fragment of slice.fragments) {
                const text = exact ? fragment.text : unexactify(fragment.text);
                if (text.includes(term)) {
                    results.push({
                        text: fragment.text.replace(/\\N/g, " "),
                        // timeStart: roundPlaces(dialog.start, 3),
                        // timeEnd: roundPlaces(dialog.end, 3),
                        timeStart: dialog.start,
                        timeEnd: dialog.end,
                    });
                }
            }
        }
    } // and they say Lisp nesting is bad
    return results;
};

const search = async (term, exact, subsDir) => {
    if (!exact) term = unexactify(term);
    const results = {};
    const filenames = (await fs.readdir(subsDir))
        .filter(filename => path.extname(filename).toLowerCase() === ".ass");
    for (const filename of filenames) {
        const filePath = path.join(subsDir, filename);
        const resultsOne = await searchOne(filePath, term, exact);
        if (resultsOne.length) {
            results[path.parse(filename).name] = resultsOne;
        }
    }
    return results;
};

module.exports = search;
