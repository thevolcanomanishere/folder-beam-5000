const Hyperbeam = require("hyperbeam");
const utils = require("./utils.js");
const fs = require("fs");
const archiver = require("archiver");
const unzip = require("unzip-stream");
const argv = require("minimist")(process.argv.slice(2));
const progress = require("progress-stream");

console.log("\nFolder Beam 5000 📁  ➡️  🧨\n");

if (argv.h) utils.commandLineHelp(true);
utils.commandLineHelp(false);

// Get the user provided path
const pathServer = argv.s ? argv.s : "./";
if (argv.s) {
  console.log("Beaming files from: " + pathServer);
} else {
  console.log("Beaming files from: current working directory");
  console.log("Use -s to specify a path");
}

// Determine if we are in server or client mode
const keyAsArgument = argv._.length > 0 ? argv._[0] : null;

const pathClient = argv.d ? argv.d : "./";
if (keyAsArgument) {
  if (argv.d) {
    console.log("Beaming files to: " + pathClient);
  } else {
    console.log("Beaming files to: current working directory");
    console.log("Use -d to specify a path");
  }
}

const serverMode = (password) => {
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

  console.log("\n");
  console.log("Getting your files ready 📁");
  console.log("This might take some time if you have 000's of files 🤓");
  console.log("\n");

  const files = utils.getFiles(pathServer);
  const fileSize = utils.getDirSize(pathServer);
  console.log("Files to send: ", files.length); // Don't count the binary itself or the key file
  console.log("Total folder size: " + fileSize + " MB");
  console.log("Waiting for the client to connect...");

  const archive = archiver("zip", {
    namePrependSlash: true,
    store: true,
  });

  // for every file in files, append to archive
  files.forEach((file) => {
    archive.append(fs.createReadStream(file), { name: file });
  });
  archive.finalize();

  const streamProgress = progress({
    length: parseInt(fileSize) * 1000000,
    time: 100,
  });

  streamProgress.on("progress", (progress) => {
    utils.printStats(progress);
  });

  archive.pipe(streamProgress).pipe(beam);
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
    utils.printReplace("Transfer finished 🚀");
    return beam.end();
  });

  const streamProgress = progress({
    time: 100,
  });

  streamProgress.on("progress", (progress) => {
    utils.printReplace(
      `Received ${(progress.transferred / 1000000).toFixed(2)} MB | Runtime: ${
        progress.runtime
      } seconds`
    );
  });

  const unzipper = unzip.Extract({ path: pathClient });
  beam.pipe(streamProgress).pipe(unzipper);
};

if (!keyAsArgument) {
  console.log("\n");
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
