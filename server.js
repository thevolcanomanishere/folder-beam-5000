const Hyperbeam = require("hyperbeam");
const fs = require("fs");
const tar = require("tar-fs");
const StreamSpeed = require("streamspeed");
const b4a = require("b4a");
const sodium = require("sodium-universal");
const b32 = require("hi-base32");

const toBase32 = (buf) => {
  return b32.encode(buf).replace(/=/g, "").toLowerCase();
};

const randomBytes = (length) => {
  const buffer = b4a.alloc(length);
  sodium.randombytes_buf(buffer);
  return buffer;
};

const key = toBase32(randomBytes(32));
console.log("Key: ", key);

const beam = new Hyperbeam(key, { announce: true });

const speed = new StreamSpeed();
speed.add(beam);

// write key text to file
fs.writeFile("key.txt", key, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("Key file created");
});

speed.on("speed", (s) => {
  console.log("Reading at", s, "bytes per second");
});

if (beam.announce) {
  console.log("Online 🧨");
} else {
  console.error("[hyperbeam] Connecting pipe...");
}

beam.on("connected", () => {
  console.error(
    "[hyperbeam] Success! Encrypted tunnel established to remote peer"
  );
});

const closeASAP = () => {
  console.error("[hyperbeam] Shutting down beam...");

  const timeout = setTimeout(() => process.exit(1), 2000);
  beam.destroy();
  beam.on("close", () => {
    clearTimeout(timeout);
  });
};

beam.on("error", (e) => {
  console.error("[hyperbeam] Error:", e.message);
  closeASAP();
});

beam.on("end", () => beam.end());

// Get list of all files recursively in this folder using fs and print to console
const getFiles = (dir, files_) => {
  files_ = files_ || [];
  const files = fs.readdirSync(dir);
  for (const i in files) {
    const name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
};

// get size in mb of all files in a directory
const getDirSize = (dir) => {
  const files = getFiles(dir);
  let size = 0;
  for (const i in files) {
    const stats = fs.statSync(files[i]);
    size += stats["size"];
  }
  return (size / 1000000.0).toFixed(2) + " MB";
};

const files = getFiles("./");
console.log("Files to send: ", files.length - 1); // Don't count the binary itself
console.log("Total folder size: " + getDirSize("./"));

tar
  .pack("./", {
    ignore: (name) => {
      return name === "folder-beam-server"; // Ignore the server binary
    },
  })
  .pipe(beam);
