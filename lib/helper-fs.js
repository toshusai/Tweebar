const fs = require("fs");
exports.check = function (filePath) {
    var isExist = false;
    try {
        fs.statSync(filePath);
        return true;
    } catch (err) {
        return false;
    }
    return isExist;
}

exports.read = function (filePath) {
    var content = new String();
    if (exports.check(filePath)) {
        content = fs.readFileSync(filePath);
    }
    return content;
};

exports.write = function (filePath, stream) {
    var result = false;
    try {
        fs.writeFileSync(filePath, stream);
        return true;
    } catch (err) {
        return false;
    }
}

exports.delete = function (filePath) {
    var result = false;
    try {
        fs.unlinkSync(filePath);
        return true;
    } catch (err) {
        return false;
    }
}