# tuus-imago
Tuus Imago front page

## Cloudinary setup (required for upload)

This app uploads directly from browser to Cloudinary, so you must configure an **unsigned upload preset**.

### 1) Create upload preset in Cloudinary

1. Open Cloudinary Dashboard.
2. Go to **Settings → Upload → Upload presets**.
3. Click **Add upload preset**.
4. Set:
	- **Signing Mode**: `Unsigned`
	- **Folder**: `tuus-imago` (optional, but matches app defaults)
	- **Allowed formats**: `jpg,jpeg,png,webp`
	- **Max file size**: `10MB` (optional, UI already checks)
5. Save and copy preset name.

### 2) Configure `.env`

Set these values:

- `VITE_CLOUDINARY_CLOUD_NAME=<your_cloud_name>`
- `VITE_CLOUDINARY_UPLOAD_PRESET=<your_unsigned_preset_name>`

`VITE_CLOUDINARY_API_KEY` is optional for current browser flow.

### 3) Important security note

Do **not** expose `CLOUDINARY_API_SECRET` in frontend `VITE_*` variables.
For signed uploads or admin operations, use a backend endpoint that signs requests server-side.
