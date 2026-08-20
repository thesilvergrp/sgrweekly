// Brand assets hosted in S3 (bucket: silvergroup-logo, region: us-east-2).
//
// The logo (the framed brand mark next to "The Silver Group") is loaded from
// this object. For it to render, the object must be publicly readable
// (s3:GetObject) — a plain <img> needs no CORS, only public read. See DEPLOY.md.
export const LOGO_URL =
  'https://silvergroup-logo.s3.us-east-2.amazonaws.com/sgLogo.png';
