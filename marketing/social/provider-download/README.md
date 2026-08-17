# Petappro provider download social graphic

Finished size: **958 × 1200 px**.

The default output is a reusable provider template. Update `provider.json` with the provider name and code. To replace the logo placeholder, save a PNG, JPG, or SVG in `assets/` and set `providerLogo` to a relative path such as `assets/my-provider-logo.png`.

Build from this directory with the bundled Codex Node runtime and image dependencies:

```sh
NODE_PATH=/Users/dannybaker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
  /Users/dannybaker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  build-graphic.mjs
```

Outputs:

- `petappro-provider-download-template.png` — ready to post
- `petappro-provider-download-template.svg` — editable, self-contained source

The QR code points to `https://www.petappro.com/download`. Regenerate `assets/download-qr.svg` if the destination changes.
