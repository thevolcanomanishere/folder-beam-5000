const fs = require("fs");
const b32 = require("hi-base32");
const sodium = require("sodium-universal");
const b4a = require("b4a");

const randomBytes = (length) => {
  const buffer = b4a.alloc(length);
  sodium.randombytes_buf(buffer);
  return buffer;
};

const toBase32 = (buf) => {
  return b32.encode(buf).replace(/=/g, "").toLowerCase();
};

// List of files that are not counted in the number of files sent
const filter = ["folder-beam", "key.txt", ".DS_Store"];

const Utils = {
  getDirSize: (dir) => {
    const files = Utils.getFiles(dir);
    let size = 0;
    for (const i in files) {
      if (files[i].includes("key.txt") || files[i].includes("folder-beam"))
        break;
      const stats = fs.statSync(files[i]);
      size += stats["size"];
    }
    return (size / 1000000.0).toFixed(2) + " MB";
  },
  getFiles: (dir, files_) => {
    files_ = files_ || [];
    const files = fs.readdirSync(dir);
    for (const i in files) {
      const name = dir + "/" + files[i];
      if (fs.statSync(name).isDirectory()) {
        Utils.getFiles(name, files_);
      } else {
        files_.push(name);
      }
    }

    return files_.filter((file) => {
      return !filter.some((f) => file.includes(f));
    });
  },
  createKey: () => {
    return toBase32(randomBytes(32));
  },
  writeKeyFile: (key) => {
    fs.writeFileSync("key.txt", key, (err) => {
      if (err) {
        return console.log(err);
      }
      console.log("Key file created");
    });
  },
};

module.exports = Utils;
