# Shared portable-manifest fixtures

The library server (`validatePortableManifestHardware`), the Apple clients
(`TVRemoteLibraryClient.validateManifest`) and Android
(`PortableHardwareManifest.validate`) each implement PORTABLE_MANIFEST_V2.md.
Their tests all read these files: every manifest in `valid/` must be
accepted and every one in `invalid/` rejected by all three. Each invalid
file differs from `valid/mega-drive.json` in one way, named by its file.
