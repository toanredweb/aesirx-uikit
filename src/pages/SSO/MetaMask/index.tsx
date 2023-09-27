import React, { useState } from 'react';
import { useWeb3Modal } from '@web3modal/react';
import { Image } from 'components';
import ButtonCopy from '../../../components/ButtonCopy';
// import ethereum_logo from '@/public/images/ethereum_icon.png';
import { useUserContext } from '../../../providers/user';
import { Button } from 'react-bootstrap';
import { shortenString } from '../../../store/UtilsStore/web3';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createConfig, WagmiConfig, useAccount } from 'wagmi';
import { arbitrum, mainnet, polygon } from 'wagmi/chains';
import { CONCORDIUM_WALLET_CONNECT_PROJECT_ID } from '@concordium/react-components';
interface Props {
  connectWallet: (address: string, walletType: string) => Promise<void>;
  setShow: any;
}

const chains = [arbitrum, mainnet, polygon];

const projectId = CONCORDIUM_WALLET_CONNECT_PROJECT_ID;

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [...w3mConnectors({ projectId, chains })],
  publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

const MetaMask = ({ connectWallet, setShow }: Props) => {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <MetaMaskApp connectWallet={connectWallet} setShow={setShow} />
      </WagmiConfig>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  );
};

const MetaMaskApp = ({ connectWallet, setShow }: Props) => {
  const { aesirxData } = useUserContext();
  const { open, isOpen } = useWeb3Modal();
  const { address, isConnecting } = useAccount();
  const [connecting, setConnecting] = useState(false);

  const walletAddress = aesirxData?.wallet_metamask ? aesirxData?.wallet_metamask : address;

  const hanleConnect = async (address: string, walletType: string) => {
    setConnecting(true);
    await connectWallet(address, walletType);
    setConnecting(false);
  };

  return (
    <div className="py-2rem px-4 border rounded">
      <h3 className="fw-semibold fs-18 mb-12px">
        {/* <Image className="me-14px" src={ethereum_logo} width={25} height={40} alt="logo ethereum" /> */}
        Ethereum
      </h3>
      <p className="fw-medium mb-12px">Address</p>
      <div className="position-relative overflow-hidden fs-7 mb-12px py-12px px-3 bg-gray-100 rounded border border-gray-stoke-1">
        <span className="fw-normal">
          {!walletAddress ? 'Not Connect!' : shortenString(walletAddress, 20, 6)}
        </span>
        <ButtonCopy
          content={walletAddress || aesirxData?.wallet_metamask}
          className=" border-0 top-0 bottom-0 p-0 px-2 bg-gray-100 position-absolute end-0"
        />
      </div>
      {!aesirxData?.wallet_metamask && (
        <Button
          disabled={isConnecting || isOpen || connecting}
          onClick={() => {
            !address ? open() : hanleConnect(address, 'metamask');
          }}
          variant="success"
          className="fw-semibold py-12px py-12px w-100"
        >
          {address ? 'Connect this address' : 'Connect to Ethereum wallets'}
        </Button>
      )}
      {aesirxData?.wallet_metamask && (
        <Button
          onClick={() =>
            setShow({
              show: true,
              data: {
                wallet: 'metamask',
                address: aesirxData?.wallet_metamask,
              },
            })
          }
          variant="danger"
          className="fw-semibold py-12px py-12px w-100"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
};

export default MetaMask;
