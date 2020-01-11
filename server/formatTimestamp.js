const formatTimestamp = time => {
    const h = Math.floor(time / 3600);
    const minutes = time % 3600;
    const m = Math.floor(minutes / 60);
    const s = minutes % 60;
    return [h, m, s].map(n => n.toString().padStart(2, "0")).join(":");
};

module.exports = formatTimestamp;
