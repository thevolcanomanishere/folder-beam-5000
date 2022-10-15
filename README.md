# Folder Beam 5000

📁🏠 ➡️ 🌍 ➡️ 🏠📁

I want a convenient, multi-platform, single executable way to magically beam the contents of a folder from one computer to another without any messing around with IPs, Firewalls, NAT etc etc.

## Usage

1. Run `folder-beam-server` on the source computer. This will generate a `key.txt` file.
2. Copy `folder-beam-client` and `key.txt` to the destination folder.
3. Run `folder-beam-client` on the destination computer.
4. ....

## TODO

- [x] Send all files in folder from source to desitination folder
- [x] Generate unique key from server bin
- [x] Load key into client bin
- [ ] Progress bar
- [ ] Transfer speed
