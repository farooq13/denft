import { Web3AuthNoModal } from '@web3auth/no-modal';

const web3auth = new Web3AuthNoModal({} as any);
web3auth.connectTo("auth", {
  loginProvider: "google"
});
