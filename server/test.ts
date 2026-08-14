import { PinataSDK } from "pinata";
import * as fs from "fs";

const pinata = new PinataSDK({ pinataJwt: "test", pinataGateway: "test" });
const stream = fs.createReadStream("test.ts");
// try to compile this to see if it works
