const path = require("path");
const execa = require("execa");
const formatTimestamp = require("./formatTimestamp");

const posixifyPath = filepath => filepath.split(path.sep).join(path.posix.sep);

const render = async (filePath, time, outDir, outName) => {
    const timestamp = formatTimestamp(time);
    const outPath = path.join(outDir, outName);

    const cmd = "ffmpeg";
    const args = [
        "-y", "-i", filePath,
        "-vf", `subtitles=${posixifyPath(path.relative(process.cwd(), filePath))}`,
        "-ss", timestamp, "-vframes", "1",
        outPath
    ];

    console.log(cmd, ...args);
    await execa(cmd, args);
};

module.exports = render;
