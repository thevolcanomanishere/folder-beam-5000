import Hyperbeam from "hyperbeam";
import fs from "fs";
import tar from "tar-fs";
import logUpdate from "log-update";
import b4a from "b4a";
import sodium from "sodium-universal";
import b32 from "hi-base32";

const toBase32 = (buf) => {
  return b32.encode(buf).replace(/=/g, "").toLowerCase();
};

const randomBytes = (length) => {
  const buffer = b4a.alloc(length);
  sodium.randombytes_buf(buffer);
  return buffer;
};

const key = toBase32(randomBytes(32));
const beam = new Hyperbeam(key, { announce: true });

console.log(`On the client, Run: echo ${key} > key.txt`);
console.log(`Or pass in the key as an argument 🙂`);

// write key text to file
fs.writeFileSync("key.txt", key, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("Key file created");
});

// Get the user provided path
const path = process.argv[2] || "./tmpServer";

if (beam.announce) {
  console.log("Online 🧨");
} else {
  console.error("[hyperbeam] Connecting pipe...");
}

beam.on("connected", () => {
  console.error(
    "[hyperbeam] Success! Encrypted tunnel established to remote peer"
  );
  console.log("Beaming files to client 🚀");
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

const files = getFiles(path);
const fileSize = getDirSize(path);
console.log("Files to send: ", files.length - 2); // Don't count the binary itself or the key file
console.log("Total folder size: " + fileSize);

tar
  .pack(path, {
    ignore: (name) => {
      return name.includes("folder-beam") || name === "key.txt";
    },
  })
  .pipe(beam);
