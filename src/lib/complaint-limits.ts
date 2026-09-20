/**
 * Complaint photo limits shared by the customer form (`src/pages/complaint.tsx`)
 * and the `submit-complaint` Netlify function so the client guard and the
 * server validation cannot drift apart. Kept dependency-free because the
 * Netlify function imports it directly.
 */
export const COMPLAINT_PHOTO_MAX_COUNT = 5;
export const COMPLAINT_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Kept separate from order uploads so complaint assets can be managed apart. */
export const COMPLAINT_PHOTO_FOLDER = "tuus-imago/complaints";
