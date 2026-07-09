import { PinataSDK } from 'pinata';
const p = new PinataSDK({pinataJwt: 'test', pinataGateway: 'test'});
async function run() {
  const result = await p.upload.public.file(new File([], ""));
  console.log(result.cid);
}
