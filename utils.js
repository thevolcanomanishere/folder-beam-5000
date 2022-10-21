const fs = require("fs");
const b32 = require("hi-base32");
const sodium = require("sodium-universal");
const b4a = require("b4a");
const readline = require("readline");

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
    startTime,
    transferFinished
  ) => {
    const time = Date.now();
    const speed = (totalDataSent - lastDataSent) / (time - lastTime);
    lastDataSent = totalDataSent;
    lastTime = time;
    const timeLeft = (fileSize - totalDataSent / 1000000) / (speed / 1000);
    const timeLeftString =
      timeLeft < 60
        ? timeLeft.toFixed(0) + " seconds"
        : (timeLeft / 60).toFixed + " minutes";
    const totalTimeElapsed = Math.floor((time - startTime) / 1000);
    const timeElapsedFormatted =
      totalTimeElapsed < 60
        ? totalTimeElapsed + "s"
        : totalTimeElapsed / 60 + "m";
    if (connectedToPeer) {
      const sent = (totalDataSent / 1000000).toFixed(2);
      const howFast = (speed / 1000).toFixed(2);
      Utils.printReplace(
        `Sent ${sent}/${fileSize} MB || ${howFast} MB/s || ${(
          (totalDataSent / 1000000 / fileSize) *
          100
        ).toFixed(2)}% || ${timeLeftString}`
      );
    }

    if (transferFinished && (totalDataSent / 1000000).toFixed(2) === fileSize) {
      process.stdout.clearLine();
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
  askQuestion: (query) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) =>
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
      })
    );
  },
  commandLineHelp: () => {
    console.log("Usage for server : $ folder-beam -p [PASSWORD] [-d DEV MODE]");
    console.log("Usage for client : $ folder-beam [PASSWORD] [-d DEV MODE]");
    process.exit(1);
  },
};

module.exports = Utils;
