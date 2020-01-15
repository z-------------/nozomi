const fs = require("fs").promises;

const list = async dir => {
    const filenames = await fs.readdir(dir);
    return filenames;
};

module.exports = list;
