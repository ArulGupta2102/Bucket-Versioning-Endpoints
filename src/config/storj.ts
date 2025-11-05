export const storjConfiguration = () => ({
  storj: {
    accessKey: process.env.STORJ_ACCESS_KEY,
    secretKey: process.env.STORJ_SECRET_KEY,
    bucket: process.env.STORJ_BUCKET,
    endpoint: process.env.STORJ_ENDPOINT,
  },
});