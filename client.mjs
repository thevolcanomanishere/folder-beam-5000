import Hyperbeam from "hyperbeam";
import fs from "fs";
import tar from "tar-fs";
import logUpdate from "log-update";

let key;
let totalData = 0;

// load key.txt file
fs.readFile("key.txt", "utf8", (err, data) => {
  if (err) {
    return console.log("No key.txt file found");
  }
  console.log("Key.txt detected: ", data);
  key = data;

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

  beam.on("data", (data) => {
    totalData += data.length;
    // output total data received in mb
    logUpdate(`Received ${(totalData / 1000000).toFixed(2)} MB`);
  });

  beam.pipe(tar.extract("./tmpClient"));
});
