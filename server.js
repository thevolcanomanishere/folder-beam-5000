const Hyperbeam = require("hyperbeam");
const fs = require("fs");

const beam = new Hyperbeam(
  "x3sebeqn4jdvhbo7ctbehyf7crydagxgeaz37idg2mi5xngoerja",
  { announce: true }
);

if (beam.announce) {
  console.error("[hyperbeam] Run hyperbeam " + beam.key + " to connect");
  console.error(
    "[hyperbeam] To restart this side of the pipe with the same key add -r to the above"
  );
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

const files = getFiles("./transferFrom");
console.log("Files to send: ", files.length);

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

console.log("Total folder size: " + getDirSize("./transferFrom"));

for (file in files) {
  const stream = fs.createReadStream(files[file]);
  console.log(files[file]);
  stream.pipe(beam);
}
