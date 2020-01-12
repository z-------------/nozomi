const path = require("path");

const loadConfig = () => {
    const config = require("../config.json");
    for (const key in config) {
        if (key.endsWith("_dir")) {
            config[key] = path.resolve(path.join(__dirname, ".."), config[key]);
        }
    }
    return config;
};

module.exports = loadConfig;
