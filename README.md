# Folder Beam 5000

📁🏠 ➡️ 🌍 ➡️ 🏠📁

I want a convenient, multi-platform, single executable way to magically beam the contents of a folder from one computer to another without any messing around with IPs, Firewalls, NAT etc etc.

## Why don't you just use Dropbox / Google Drive / OneDrive / iCloud / etc?

All of those services are great, but they have a few drawbacks:

- They require a login
- They require a browser
- They require a GUI
- They require you to trust a third party with your data
- You need to upload all your files and then download them. Double the time!

Folder Beam 5000 allows you to directly send your files peer 2 peer, even between computers that are behind a firewall or NAT.

### Usage

1. Download the binaries for your source and destination platform from [Releases](https://github.com/thevolcanomanishere/folder-beam-5000/releases)
2. For linux/macOS, run `chmod +x folder-beam-linux-[ARCH]` to make the binary executable
3. Run `folder-beam-[PLATFORM]-[ARCH]` on the source computer. This will generate a `key.txt` file.
4. Copy `folder-beam-[PLATFORM]-[ARCH]` and `key.txt` to the destination folder.
5. Run `folder-beam-[PLATFORM]-[ARCH]` on the destination computer.
6. ....

### TODO

- [x] Send all files in folder from source to desitination folder
- [x] Generate unique key from server bin
- [x] Load key into client bin
- [ ] Progress bar
- [ ] Transfer speed

### Credits

I simply knitted a few libraries together created by [Mafintosh](https://github.com/mafintosh) and everyone at [HyperCore](https://hypercore-protocol.org/). All credit to them.
