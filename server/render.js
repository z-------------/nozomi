const path = require("path");
const execa = require("execa");
const formatTimestamp = require("./formatTimestamp");

const posixifyPath = filepath => filepath.split(path.sep).join(path.posix.sep);

const escapeFilename = filename => filename.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

const render = async (filePath, time, outDir, outName) => {
    const timestamp = formatTimestamp(time);
    const outPath = path.join(outDir, outName);

    const cmd = "ffmpeg";
    const args = [
        "-y", "-i", filePath,
        "-vf", `subtitles=${escapeFilename(posixifyPath(path.relative(process.cwd(), filePath)))}`,
        "-ss", timestamp, "-vframes", "1",
        outPath
    ];

    console.log(cmd, ...args);
    try {
        await execa(cmd, args)
    } catch (e) {
        console.error(e);
    };
};

module.exports = render;
