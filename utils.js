const fs = require("fs");
const b32 = require("hi-base32");
const sodium = require("sodium-universal");
const b4a = require("b4a");

const randomBytes = (length) => {
  const buffer = b4a.alloc(length);
  sodium.randombytes_buf(buffer);
  return buffer;
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
    return (size / 1000000.0).toFixed(2);
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
  toBase32: (buf) => {
    return b32.encode(buf).replace(/=/g, "").toLowerCase();
  },
  createKey: (text) => Utils.toBase32(Buffer.alloc(32, text)),
  createRandomKey: () => Utils.toBase32(randomBytes(32)),
  writeKeyFile: (key) => {
    fs.writeFileSync("key.txt", key, (err) => {
      if (err) {
        return console.log(err);
      }
      console.log("Key file created");
    });
  },
  printReplace: (text) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(text);
  },
  printStats: (
    lastDataSent,
    lastTime,
    fileSize,
    totalDataSent,
    connectedToPeer,
    startTime
  ) => {
    const time = Date.now();
    const speed = (totalDataSent - lastDataSent) / (time - lastTime);
    lastDataSent = totalDataSent;
    lastTime = time;
    const timeLeft = (fileSize - totalDataSent / 1000000) / (speed / 1000);
    const timeLeftString =
      timeLeft < 60 ? timeLeft.toFixed(0) + "s" : timeLeft / 60 + "m";
    const totalTimeElapsed = Math.floor((time - startTime) / 1000);
    const timeElapsedFormatted =
      totalTimeElapsed < 60
        ? totalTimeElapsed + "s"
        : totalTimeElapsed / 60 + "m";
    if (connectedToPeer) {
      Utils.printReplace(
        `Sent ${(totalDataSent / 1000000).toFixed(2)}/${fileSize} MB || ${(
          speed / 1000
        ).toFixed(2)} MB/s || ${(
          (totalDataSent / 1000000 / fileSize) *
          100
        ).toFixed(2)}% || ${timeLeftString}`
      );
    }

    if ((totalDataSent / 1000000).toFixed(2) === fileSize) {
      Utils.printReplace(
        `Sent ${(totalDataSent / 1000000).toFixed(2)}/${fileSize} MB || ${(
          speed / 1000
        ).toFixed(2)} MB/s || ${(
          (totalDataSent / 1000000 / fileSize) *
          100
        ).toFixed(2)}% || Total time: ${timeElapsedFormatted}`
      );
    }
  },
};

module.exports = Utils;
