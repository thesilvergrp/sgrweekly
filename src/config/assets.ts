/**
 * External asset locations.
 *
 * S3 — bucket `silvergroup-logo` (us-east-2), object `sgLogo.png`, public-read.
 * It is fetched by a plain <img>: no SDK, no credentials, no CORS requirement.
 * The rebuilt interface draws its own vector brand mark, so nothing on the page
 * depends on this object resolving; the URL is retained so the existing S3
 * integration stays documented and usable. The bucket and its policy were NOT
 * modified.
 */
export const S3_BRAND_IMAGE_URL =
  'https://silvergroup-logo.s3.us-east-2.amazonaws.com/sgLogo.png';

/** OwnerRez media CDN host — property photography lives here. */
export const OWNERREZ_CDN_HOST = 'uc.orez.io';
