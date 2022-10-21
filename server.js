const Hyperbeam = require("hyperbeam");
const { PassThrough } = require("streamx");
const utils = require("./utils.js");
const { clearInterval } = require("timers");
const fs = require("fs");
const archiver = require("archiver");
const unzip = require("unzip-stream");
const argv = require("minimist")(process.argv.slice(2));

console.log("\nFolder Beam 5000 📁  ➡️  🧨\n");

if (argv.h) utils.commandLineHelp();

const DEV = argv.d ? true : false;
if (DEV) console.log("Running in dev mode");
// Get the user provided path
const pathServer = DEV ? "./tmpServer" : "./";
const pathClient = DEV ? "./tmpClient" : "./";

const serverMode = (password) => {
  let connectedToPeer = false;
  let transferFinished = false;
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

  beam.on("end", () => {
    transferFinished = true;
  });

  const files = utils.getFiles(pathServer);
  const fileSize = utils.getDirSize(pathServer);
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
      startTime,
      transferFinished
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
      startTime,
      transferFinished
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

  const unzipper = unzip.Extract({ path: pathClient });
  beam.pipe(unzipper);
};

// Determine if we are in server or client mode
const keyAsArgument = argv._.length > 0 ? argv._[0] : null;
console.log(argv);
if (!keyAsArgument) {
  console.log("Folder Beam server mode 👍");
  console.log(
    "If you want to receive files, you need to provide the password as an argument"
  );
  console.log("Example: ./folder-beam 1234");
  console.log("\n");
  if (argv.p) {
    console.log("Password provided: " + argv.p);
    return serverMode(argv.p);
  }
  return utils.askQuestion("Create a password: ").then((password) => {
    return serverMode(password);
  });
} else {
  return clientMode(keyAsArgument);
}
