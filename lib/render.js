const path = require("path");
const execa = require("execa");
const match = require("suitchi");

const Enum = require("./enum");
const formatTimestamp = require("./formatTimestamp");
const loadMetadata = require("./loadMetadata");

const RenderMode = new Enum("Screenshot", "Audio", "VideoSub", "VideoNoSub");

const posixifyPath = filepath => filepath.split(path.sep).join(path.posix.sep);

const escapeFilename = filename => filename.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

const runCommand = async args => {
    const cmd = "ffmpeg";
    console.log(cmd, args);
    try {
        await execa(cmd, args);
    } catch (e) {
        console.error(e);
    };
};

const render = async (mode, videoPath, subDir, [timeStart, timeEnd], outDir, outName) => {
    const timestampStart = formatTimestamp(timeStart);
    const timestampEnd = formatTimestamp(timeEnd);
    const outPath = path.join(outDir, outName);
    const metadata = await loadMetadata(subDir, path.parse(videoPath).name);

    const subtitlesArg = `subtitles=${escapeFilename(posixifyPath(path.relative(process.cwd(), videoPath)))}:si=${metadata.subTrackIndex}`;
    const args = match(mode, [
        [RenderMode.Screenshot, [
            "-y",
            "-copyts",
            "-ss", timestampStart,
            "-i", videoPath,
            "-vf", subtitlesArg,
            "-frames:v", "1",
            outPath
        ]],
        [RenderMode.Audio, [
            "-y",
            "-ss", timestampStart,
            "-to", timestampEnd,
            "-i", videoPath,
            "-map", `0:a:${metadata.subTrackIndex}`, // corresponding audio and sub tracks are usually parallel
            "-vn",
            outPath
        ]],
        [[RenderMode.VideoSub, RenderMode.VideoNoSub], [
            "-y",
            "-copyts",
            "-ss", timestampStart,
            "-to", timestampEnd,
            "-i", videoPath,
            ... mode === RenderMode.VideoSub ? ["-vf", subtitlesArg] : [],
            "-map", `0:v:0`,
            "-map", `0:a:${metadata.subTrackIndex}`,
            outPath
        ]],
    ]);
    return await runCommand(args);
};

module.exports = { RenderMode, render };
