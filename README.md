# Folder Beam 5000

📁🏠 ➡️ 🌍 ➡️ 🏠📁

I want a convenient, multi-platform, single executable way to magically beam the contents of a folder from one computer to another without any messing around with IPs, Firewalls, NAT etc etc.

- Works on LAN
- Works over the internet with computers behind home networks and firewalls
- No account needed

Super efficient:

- 35-40mb RAM
- 3-5% CPU

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
3. Run `folder-beam-[PLATFORM]-[ARCH]` on the source computer
4. Enter a password that you want to encrypt your connection with
5. Copy `folder-beam-[PLATFORM]-[ARCH]` to the destination computer
6. Run `folder-beam-[PLATFORM]-[ARCH] [Password]` on the destination computer
7. A connection will be attempted, as soon as it connects, your files will start uploading

### TODO

- [x] Send all files in folder from source to desitination folder
- [x] Generate unique key from server bin
- [x] Load key into client bin
- [x] Transfer speed
- [x] Password instead of key file
- [ ] Progress bar
- [ ] GUI
- [ ] Codesign binaries for macOS

### Credits

I simply knitted a few libraries together created by [Mafintosh](https://github.com/mafintosh) and everyone at [HyperCore](https://hypercore-protocol.org/). All credit to them.
