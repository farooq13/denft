import { PinataSDK } from "pinata";
import * as fs from "fs";

async function run() {
  const pinata = new PinataSDK({ pinataJwt: "test", pinataGateway: "test" });
  const stream = fs.createReadStream("test.ts");
  
  // Try to use a native File object or stream
  const file = new File(["foo"], "foo.txt", { type: "text/plain" });
  await pinata.upload.file(file);
}
