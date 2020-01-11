const path = require("path");
const execa = require("execa");

const extract = async (inPath, outDir) => {
    const inName = path.basename(inPath);

    const outName = path.parse(inName).name + ".ass";
    const outPath = path.join(outDir, outName);

    const cmd = "ffmpeg";
    const args = ["-y", "-i", inPath, outPath];

    console.log(cmd, ...args);
    try {
        await execa(cmd, args)
    } catch (e) {
        console.error(e);
    };
};

module.exports = extract;
