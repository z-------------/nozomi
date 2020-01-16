const path = require("path");
const execa = require("execa");
const fs = require("fs").promises;
const formatTimestamp = require("./formatTimestamp");
const loadMetadata = require("./loadMetadata");

const posixifyPath = filepath => filepath.split(path.sep).join(path.posix.sep);

const escapeFilename = filename => filename.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

const render = async (videoPath, subDir, timeStart, outDir, outName) => {
    const timestampStart = formatTimestamp(timeStart);

    const outPath = path.join(outDir, outName);
    const name = path.parse(videoPath).name;

    const metadata = await loadMetadata(subDir, name);

    const cmd = "ffmpeg";
    const args = [
        "-y",
        "-copyts",
        "-ss", timestampStart,
        "-i", videoPath,
        "-vf", `subtitles=${escapeFilename(posixifyPath(path.relative(process.cwd(), videoPath)))}:si=${metadata.subTrackIndex}`,
        "-frames:v", "1",
        outPath
    ];

    console.log(cmd, args);
    try {
        await execa(cmd, args);
    } catch (e) {
        console.error(e);
    };
};

module.exports = render;
