const Hyperbeam = require("hyperbeam");
const fs = require("fs");
const tar = require("tar-fs");
const StreamSpeed = require("streamspeed");

const beam = new Hyperbeam(
  "x3sebeqn4jdvhbo7ctbehyf7crydagxgeaz37idg2mi5xngoerja",
  { announce: true }
);

const speed = new StreamSpeed();
speed.add(beam);

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
  beam.on("close", function () {
    clearTimeout(timeout);
  });
};

beam.on("error", function (e) {
  console.error("[hyperbeam] Error:", e.message);
  closeASAP();
});

beam.on("end", () => beam.end());

// Get list of all files recursively in this folder using fs and print to console
const getFiles = function (dir, files_) {
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
const getDirSize = function (dir) {
  const files = getFiles(dir);
  let size = 0;
  for (const i in files) {
    const stats = fs.statSync(files[i]);
    size += stats["size"];
  }
  return (size / 1000000.0).toFixed(2) + " MB";
};

const files = getFiles("./");
console.log("Files to send: ", files.length);
console.log("Total folder size: " + getDirSize("./"));

tar
  .pack("./", {
    ignore: (name) => {
      return name === "folder-beam-server"; // Ignore the server binary
    },
  })
  .pipe(beam);
