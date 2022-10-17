# Folder Beam 5000

📁🏠 ➡️ 🌍 ➡️ 🏠📁

I want a convenient, multi-platform, single executable way to magically beam the contents of a folder from one computer to another without any messing around with IPs, Firewalls, NAT etc etc.

## Usage

1. Download the binaries for your source and destination platform from [Releases](https://github.com/thevolcanomanishere/folder-beam-5000/releases)
2. Run `folder-beam-[PLATFORM]-[ARCH]` on the source computer. This will generate a `key.txt` file.
3. Copy `folder-beam-[PLATFORM]-[ARCH]` and `key.txt` to the destination folder.
4. Run `folder-beam-[PLATFORM]-[ARCH]` on the destination computer.
5. ....

## TODO

- [x] Send all files in folder from source to desitination folder
- [x] Generate unique key from server bin
- [x] Load key into client bin
- [ ] Progress bar
- [ ] Transfer speed

## Credits

I simply knitted a few libraries together created by [Mafintosh](https://github.com/mafintosh) and everyone at [HyperCore](https://hypercore-protocol.org/). All credit to them.
