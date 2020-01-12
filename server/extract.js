const path = require("path");
const execa = require("execa");
const fs = require("fs");
const { Decoder } = require("ebml");
const Enum = require("../lib/enum");

const TrackType = new Enum({
    Video: 1,
    Audio: 2,
    Subtitle: 17,
});

const getTracks = inPath => {
    const decoder = new Decoder();
    const stream = fs.createReadStream(inPath);

    const tracks = [];
    let voidCount = 0;
    let curTrack = -1;

    return new Promise(resolve => {
        let destroy = false;
        stream.pipe(decoder)
            .on("data", chunk => {
                if (destroy) return;
                if (chunk[0] !== "tag") return;

                const { name, value } = chunk[1];

                if (name === "Void") {
                    if (++voidCount === 2) {
                        destroy = true;
                        stream.destroy();
                        resolve(tracks);
                    }
                    return;
                }

                if (name === "TrackNumber") {
                    curTrack = tracks.length;
                    tracks.push({ "TrackNumber": value });
                    return;
                }

                if (curTrack !== -1) {
                    tracks[curTrack][name] = value;
                }
            });
    });
};

const getSubtitleTrack = async inPath => {
    let subTrackIndex; // not its track number, but its index within the subtitle tracks

    const tracks = await getTracks(inPath);
    const audioTracks = tracks.filter(track => track["TrackType"] === TrackType.Audio);
    const subTracks = tracks.filter(track => track["TrackType"] === TrackType.Subtitle);

    if (subTracks.length === 1) {
        subTrackIndex = 0;
    } else {
        for (let i = 0, l = audioTracks.length; i < l; ++i) {
            const lang = audioTracks[i]["Language"];
            if (lang && lang.toLowerCase() === "jpn") {
                subTrackIndex = i;
                break;
            }
        }
        if (typeof subTrackIndex === "undefined") {
            subTrackIndex = 0;
        }
    }

    return subTrackIndex;
};

const extract = async (inPath, outDir) => {
    const subTrackIndex = await getSubtitleTrack(inPath);

    const inName = path.basename(inPath);
    const name = path.parse(inName).name;

    const outName = name + ".ass";
    const outPath = path.join(outDir, outName);
    const metadataName = name + ".txt";
    const metadataPath = path.join(outDir, metadataName);

    const cmd = "ffmpeg";
    const args = [
        "-y",
        "-i", inPath,
        "-map", `0:s:${subTrackIndex}`,
        outPath
    ];

    console.log(cmd, args);
    try {
        await execa(cmd, args);
        
        const metadata = [
            subTrackIndex,
        ];
        await fs.promises.writeFile(metadataPath, metadata.join("\n") + "\n", "utf-8");
    } catch (e) {
        console.error(e);
    };
};

module.exports = extract;
