const formatTimestamp = time => {
    const h = Math.floor(time / 3600);
    const minutes = time % 3600;
    const m = Math.floor(minutes / 60);
    const s = minutes % 60;
    return [
        h.toString().padStart(2, "0"),
        m.toString().padStart(2, "0"),
        s.toFixed(3).padStart(4, "0"),
    ].join(":");
};

module.exports = formatTimestamp;
