# Manual Netlify deployment

Run `netlify build --context production` to build and package the Next.js adapter output.

When deploying that existing build, explicitly use the adapter's static directory:

```powershell
netlify deploy --no-build --dir .netlify/static --json
node scripts/check-deployed-assets.mjs https://DEPLOY-ID--beata-shopco.netlify.app
```

Do not use bare `netlify deploy --no-build`: it reads the configured `.next` publish directory without applying the adapter's publish-directory change, so HTML and functions can work while CSS, JavaScript and fonts return 404.

Publish only after the deployed asset check passes, then run the same check against `https://beata-shop.co`. Also verify the rendered shop in a browser. An HTTP 200 for HTML alone does not verify a working storefront.

## Image uploads after a Windows build

The Linux function needs the matching `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64` packages. A Windows-generated function bundle can contain only `@img/sharp-win32-x64`, causing `/api/admin/product-image` to fail with an empty HTTP 500 before authentication.

Before deploying a Windows-built bundle, install the Linux package versions specified by `node_modules/sharp/package.json` and copy both package directories from `node_modules/@img/` into `.netlify/functions-internal/___netlify-server-handler/node_modules/@img/`. Check that both Linux packages are present in the final function directory.

Verify the preview upload route with an unauthenticated POST: it must return HTTP 401 with the JSON login-required message, rather than HTTP 500. Then verify a real image upload in the signed-in production admin.
