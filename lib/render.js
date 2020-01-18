const path = require("path");
const execa = require("execa");
const match = require("suitchi");

const Enum = require("./enum");
const formatTimestamp = require("./formatTimestamp");
const loadMetadata = require("./loadMetadata");

const RenderMode = new Enum("Screenshot", "Audio", "Video");

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

const formatFilenameTimestamp = timestamp => formatTimestamp(timestamp).replace(/:/g, "-");

const getRenderName = (mode, modeOpts, videoFilename, [timeStart, timeEnd]) => {
    const ext = match(mode, [
        [RenderMode.Screenshot, "jpg"],
        [RenderMode.Audio, "m4a"],
        [RenderMode.Video, "mp4"],
    ]);
    const suffix = match(mode, [
        [RenderMode.Video, modeOpts.subtitles ? "_sub" : "_nosub"],
        "",
    ]);
    return `${path.parse(videoFilename).name}-${formatFilenameTimestamp(timeStart)}-${formatFilenameTimestamp(timeEnd)}${suffix}.${ext}`;
};

const getRenderArgs = async (mode, modeOpts, videoFilename, [timeStart, timeEnd], outName, config) => {
    const subsDir = config["sub_dir"];
    const outDir = config["render_dir"];
    const videoPath = path.join(config["video_dir"], videoFilename);
    const outPath = path.join(outDir, outName);

    const timestampStart = formatTimestamp(timeStart);
    const timestampEnd = formatTimestamp(timeEnd);
    const metadata = await loadMetadata(subsDir, path.parse(videoFilename).name);
    
    const subtitlesArg = `subtitles=${escapeFilename(posixifyPath(path.relative(process.cwd(), videoPath)))}:si=${metadata.subTrackIndex}`;
    
    return match(mode, [
        [RenderMode.Screenshot, [
            "-y",
            "-copyts",
            "-ss", timestampStart,
            "-to", timestampEnd,
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
        [RenderMode.Video, [
            "-y",
            "-copyts",
            "-ss", timestampStart,
            "-to", timestampEnd,
            "-i", videoPath,
            ... modeOpts.subtitles ? ["-vf", subtitlesArg] : [],
            "-map", `0:v:0`,
            "-map", `0:a:${metadata.subTrackIndex}`,
            outPath
        ]],
    ]);
};

const render = async (mode, modeOpts, videoFilename, [timeStart, timeEnd], outName, config) => {
    const args = await getRenderArgs(mode, modeOpts, videoFilename, [timeStart, timeEnd], outName, config);
    return await runCommand(args);
};

module.exports = { RenderMode, getRenderName, getRenderArgs, render };
