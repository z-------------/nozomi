const path = require("path");
const execa = require("execa");
const fs = require("fs").promises;
const formatTimestamp = require("./formatTimestamp");

const posixifyPath = filepath => filepath.split(path.sep).join(path.posix.sep);

const escapeFilename = filename => filename.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

const render = async (videoPath, subDir, timeStart, outDir, outName) => {
    const timestampStart = formatTimestamp(timeStart);

    const outPath = path.join(outDir, outName);
    const name = path.parse(videoPath).name;

    const metadata = (await fs.readFile(path.join(subDir, `${name}.txt`), "utf-8")).split("\n").filter(line => line.length);
    const subTrackIndex = Number(metadata[0]);

    const cmd = "ffmpeg";
    const args = [
        "-y",
        "-copyts",
        "-ss", timestampStart,
        "-i", videoPath,
        "-vf", `subtitles=${escapeFilename(posixifyPath(path.relative(process.cwd(), videoPath)))}:si=${subTrackIndex}`,
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
