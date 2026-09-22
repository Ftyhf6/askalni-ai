# Android / Google Play preparation

This project is prepared as a Progressive Web App and can be packaged as an Android Trusted Web Activity (TWA) after the production Vercel URL is confirmed.

## Current package identity

- Package ID: `com.aljalal.askalni`
- App name: `اسألني AI`
- Production host configured in `twa-manifest.json`: `askalni-ai-kappa.vercel.app`

## Build the Android App Bundle

Use Bubblewrap on a machine with Node.js and the Android build tools:

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://askalni-ai-kappa.vercel.app/manifest.json
```

When prompted, use the package ID above and keep the application name as `اسألني AI`.

Then:

```bash
bubblewrap build
```

The generated Android App Bundle (`.aab`) is the file intended for Google Play Console.

## Digital Asset Links

Before publishing the TWA, the signed Android certificate SHA-256 fingerprint must be placed in:

```
public/.well-known/assetlinks.json
```

The final file must contain the exact package ID and the SHA-256 fingerprint of the certificate used to sign the Play app. Do not commit a placeholder fingerprint.

After the production domain and signing certificate are final, verify:

```
https://askalni-ai-kappa.vercel.app/.well-known/assetlinks.json
```

## Important

The production hostname in this file is provisional. If Vercel assigns a different permanent production domain, replace the hostname in the TWA configuration and rebuild the Android package.

The final Google Play submission also requires the store listing, app icon assets, screenshots, privacy/data-safety declarations, content rating, and a signed release AAB.
