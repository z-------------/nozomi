const path = require("path");
const execa = require("execa");
const formatTimestamp = require("./formatTimestamp");

const posixifyPath = filepath => filepath.split(path.sep).join(path.posix.sep);

const escapeFilename = filename => filename.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

const render = async (videoPath, timeStart, outDir, outName) => {
    const timestampStart = formatTimestamp(timeStart);

    const outPath = path.join(outDir, outName);

    const cmd = "ffmpeg";
    const args = [
        "-y",
        "-copyts",
        "-ss", timestampStart,
        "-i", videoPath,
        "-vf", `subtitles=${escapeFilename(posixifyPath(path.relative(process.cwd(), videoPath)))}:si=0`,
        "-frames:v", "1",
        outPath
    ];

    console.log(cmd, ...args);
    try {
        await execa(cmd, args);
    } catch (e) {
        console.error(e);
    };
};

module.exports = render;
