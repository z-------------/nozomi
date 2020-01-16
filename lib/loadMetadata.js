const fs = require("fs").promises;
const path = require("path");

const loadMetadata = async (subDir, name) => {
    const data = (await fs.readFile(path.join(subDir, `${name}.txt`), "utf-8")).split("\n").filter(line => line.length);
    return {
        subTrackIndex: Number(data[0]),
    };
};

module.exports = loadMetadata;
