const Hyperbeam = require("hyperbeam");
const { PassThrough } = require("streamx");
const utils = require("./utils.js");
const { clearInterval } = require("timers");
const fs = require("fs");
const archiver = require("archiver");
const unzip = require("unzip-stream");

console.log("\nFolder Beam 5000 📁  ➡️  🧨\n");

const serverMode = (password) => {
  let connectedToPeer = false;
  const key = utils.createKey(password);

  console.log(
    "\nOn the destination computer you can run:\n./folder-beam " + password
  );
  console.log(
    "\nBinary needs to be executable, so run 'chmod +x folder-beam' via terminal first 🙂"
  );
  const beam = new Hyperbeam(key, {
    announce: true,
  });

  // Get the user provided path
  const path = "./";

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
    connectedToPeer = true;
    startTime = Date.now();
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

  const files = utils.getFiles(path);
  const fileSize = utils.getDirSize(path);
  console.log("Files to send: ", files.length); // Don't count the binary itself or the key file
  console.log("Total folder size: " + fileSize + " MB");
  console.log("Waiting for the client to connect...");

  let totalDataSent = 0;
  const passThrough = new PassThrough();
  passThrough.on("data", (data) => {
    totalDataSent += data.length;
  });

  // Calculate the speed of the data transfer
  let lastDataSent = 0;
  let lastTime = Date.now();
  let startTime = 0;
  const stats = setInterval(() => {
    utils.printStats(
      lastDataSent,
      lastTime,
      fileSize,
      totalDataSent,
      connectedToPeer,
      startTime
    );
  }, 1000);

  beam.on("end", () => {
    connectedToPeer = false;
    clearInterval(stats);
    utils.printStats(
      lastDataSent,
      lastTime,
      fileSize,
      totalDataSent,
      connectedToPeer,
      startTime
    );
    beam.end();
  });

  const archive = archiver("zip", {
    namePrependSlash: true,
    store: true,
  });

  // for every file in files, append to archive
  files.forEach((file) => {
    archive.append(fs.createReadStream(file), { name: file });
  });
  archive.finalize();

  archive.pipe(passThrough).pipe(beam);
};

const clientMode = (password) => {
  const key = utils.createKey(password);
  const beam = new Hyperbeam(key);

  beam.on("connected", () => {
    console.error(
      "[hyperbeam] Success! Encrypted tunnel established to remote peer"
    );
  });

  beam.on("remote-address", ({ host, port }) => {
    if (!host) console.error("[hyperbeam] Could not detect remote address");
    else
      console.error(
        "[hyperbeam] Joined the DHT - remote address is " + host + ":" + port
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

  beam.on("end", () => {
    console.log("Beam ending...");
    return beam.end();
  });

  let totalDataReceived = 0;

  beam.on("data", (data) => {
    totalDataReceived += data.length;
    utils.printReplace(
      `Received ${(totalDataReceived / 1000000).toFixed(2)} MB`
    );
  });

  const unzipper = unzip.Extract({ path: "./" });
  beam.pipe(unzipper);
};

// Determine if we are in server or client mode
const keyAsArgument = process.argv[2] ? process.argv[2] : false;

if (!keyAsArgument) {
  console.log("Folder Beam server mode 👍");
  console.log(
    "If you want to receive files, you need to provide the password as an argument"
  );
  console.log("Example: ./folder-beam 1234");
  console.log("\n");
  return utils.askQuestion("Create a password: ").then((password) => {
    return serverMode(password);
  });
} else {
  return clientMode(keyAsArgument);
}
