# tuus-imago

Tuus Imago front page

## Cloudinary setup (required for upload)

This app uploads directly from browser to Cloudinary using a **signed upload** flow via Netlify Functions.

### 1) Create upload preset in Cloudinary

1. Open Cloudinary Dashboard.
2. Go to **Settings → Upload → Upload presets**.
3. Click **Add upload preset**.
4. Set:
   - **Signing Mode**: `Signed`
   - **Folder**: `tuus-imago` (optional, but matches app defaults)
   - **Allowed formats**: `jpg,jpeg,png,webp`
   - **Max file size**: `10MB` (optional, UI already checks)
5. Save and copy preset name.

### 2) Configure `.env`

Set these values:

- `VITE_CLOUDINARY_CLOUD_NAME=<your_cloud_name>`
- `VITE_CLOUDINARY_UPLOAD_PRESET=<your_signed_preset_name>`

Optional (AI preview template):

- `VITE_CLOUDINARY_AI_TEMPLATE=<your_named_transformation>`

`VITE_CLOUDINARY_AI_TEMPLATE` should be the **name of a Cloudinary named transformation** (without the `t_` prefix).
When set, the app adds this template to the post-upload preview URL before selected AI effects.

Example:

- `VITE_CLOUDINARY_AI_TEMPLATE=portrait_ai`

In Cloudinary, create this under **Settings → Transformations** (or named transformations UI), then reference that exact name in `.env`.

### 3) Configure Netlify function env vars

Set server-side environment variables in Netlify:

- `CLOUDINARY_API_KEY=<your_api_key>`
- `CLOUDINARY_API_SECRET=<your_api_secret>`

Local development note:

- Run with `netlify dev` so `/.netlify/functions/cloudinary-signature` is available.
- Keep these as non-`VITE_` variables because they are read by the Netlify Function runtime (`process.env`).

### 4) Important security note

Do **not** expose `CLOUDINARY_API_SECRET` in frontend `VITE_*` variables.
For signed uploads or admin operations, use a backend endpoint that signs requests server-side.

### 5) Troubleshooting

- If you see `Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in server environment`, verify you did not use `VITE_` (or `VITTE_`) prefix for function secrets.
- Frontend reads only: `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`.
- Netlify Function reads only: `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
