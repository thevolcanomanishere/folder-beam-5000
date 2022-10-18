const Hyperbeam = require("hyperbeam");
const { PassThrough } = require("streamx");
const fs = require("fs");
const tar = require("tar-fs");
const utils = require("./utils.js");

console.log("Folder Beam 5000 📁  ➡️  🧨");

// Determine if we are in server or client mode
const keyAsArgument = process.argv[2];
fs.readFile("key.txt", "utf8", (err, key) => {
  if (key || keyAsArgument) {
    return clientMode(key ? key : keyAsArgument);
  }
  if (err) {
    console.log("No key.txt file found");
    console.log("Folder Beam server mode 👍");
    return serverMode();
  }
});

const serverMode = () => {
  const key = utils.createKey();
  utils.writeKeyFile(key);
  console.log("Key: ", key);
  console.log("On the destination computer you can run:\n./folder-beam " + key);
  console.log(
    "Binary needs to be executable, so run 'chmod +x folder-beam' via terminal first 🙂"
  );
  const beam = new Hyperbeam(key, {
    announce: true,
    mapReadable: (data) => console.log(data),
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

  beam.on("end", () => {
    console.log("Files sent ✅");
  });

  const files = utils.getFiles(path);
  const fileSize = utils.getDirSize(path);
  console.log("Files to send: ", files.length); // Don't count the binary itself or the key file
  console.log("Total folder size: " + fileSize);

  let totalDataSent = 0;
  const passThrough = new PassThrough();
  passThrough.on("data", (data) => {
    totalDataSent += data.length;
    utils.printReplace(`Sent ${(totalDataSent / 1000000).toFixed(2)} MB`);
  });

  const tarFiles = tar.pack(path, {
    ignore: (name) => {
      return name.includes("folder-beam") || name === "key.txt";
    },
  });

  tarFiles.pipe(passThrough).pipe(beam);
};

const clientMode = (key) => {
  console.log("Folder Beam client mode 👍");
  console.log("Attempting to connect to source...");
  const keyArg = process.argv[2];
  if (keyArg) {
    console.log("Key argument detected: ", keyArg);
    console.log("Key argument overides key provided in key.txt");
    key = keyArg;
  } // Use key from terminal args if it exists
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
    console.log("[hyperbeam] Connection closed");
    beam.end();
  });

  let totalDataReceived = 0;

  beam.on("data", (data) => {
    totalDataReceived += data.length;
    utils.printReplace(
      `Received ${(totalDataReceived / 1000000).toFixed(2)} MB`
    );
  });

  beam.pipe(tar.extract("./"));
};
