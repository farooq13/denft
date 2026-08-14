import { PinataSDK } from 'pinata';
import { env } from './src/config/env.js';
const pinata = new PinataSDK({ pinataJwt: env.PINATA_JWT, pinataGateway: env.PINATA_GATEWAY });
async function test() {
  try {
    const url = await pinata.gateways.createSignedURL({ cid: 'QmTest', expires: 3600 });
    console.log(url);
  } catch (err) {
    console.error(err);
  }
}
test();
