const Hyperbeam = require("hyperbeam");
const fs = require("fs");

const beam = new Hyperbeam(
  "x3sebeqn4jdvhbo7ctbehyf7crydagxgeaz37idg2mi5xngoerja"
);

console.log(beam.key);

beam.on("connected", () => {
  console.error(
    "[hyperbeam] Success! Encrypted tunnel established to remote peer"
  );
});

beam.on("remote-address", function ({ host, port }) {
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
  beam.on("close", function () {
    clearTimeout(timeout);
  });
};

beam.on("error", function (e) {
  console.error("[hyperbeam] Error:", e.message);
  closeASAP();
});

beam.on("end", () => {
  console.log("[hyperbeam] Connection closed");
  beam.end();
});

const stream = fs.createWriteStream("./transferTo/test.png");

beam.on("data", (chunk) => {
  console.log(chunk.length);
  // write chunk to file
  stream.write(chunk);
});
