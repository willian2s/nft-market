import React, { useCallback } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button, Popover, Select } from 'antd';
import {
  ENDPOINTS,
  formatNumber,
  formatUSD,
  Identicon,
  Settings,
  shortenAddress,
  useConnectionConfig,
  useNativeAccount,
  useWalletModal,
  useQuerySearch,
  WRAPPED_SOL_MINT,
} from '@oyster/common';
import { useSolPrice } from '../../contexts';
import { useTokenList } from '../../contexts/tokenList';
import { TokenCircle } from '../Custom';

('@solana/wallet-adapter-base');

const btnStyle: React.CSSProperties = {
  border: 'none',
  height: 40,
};

export const CurrentUserBadge = (props: {
  showBalance?: boolean;
  showAddress?: boolean;
  iconSize?: number;
}) => {
  const { wallet, publicKey, disconnect } = useWallet();
  const { account } = useNativeAccount();
  const solPrice = useSolPrice();
  const tokenList = useTokenList();

  if (!wallet || !publicKey) {
    return null;
  }
  const balance = (account?.lamports || 0) / LAMPORTS_PER_SOL;
  const balanceInUSD = balance * solPrice;
  const solMintInfo = tokenList.tokenMap.get(WRAPPED_SOL_MINT.toString());

  let name = props.showAddress ? shortenAddress(`${publicKey}`) : '';
  const unknownWallet = wallet as any;
  if (unknownWallet.name && !props.showAddress) {
    name = unknownWallet.name;
  }

  return (
    <div className="wallet-wrapper">
      {props.showBalance && (
        <span>
          {formatNumber.format((account?.lamports || 0) / LAMPORTS_PER_SOL)} SOL
        </span>
      )}

      <Popover
        trigger="click"
        placement="bottomRight"
        content={
          <Settings
            additionalSettings={
              <div
                style={{
                  width: 250,
                }}
              >
                <h5
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    letterSpacing: '0.02em',
                  }}
                >
                  BALANCE
                </h5>
                <div
                  style={{
                    marginBottom: 10,
                    display: 'flex',
                  }}
                >
                  <TokenCircle
                    iconFile={solMintInfo ? solMintInfo.logoURI : ''}
                  />
                  &nbsp;
                  <span
                    style={{
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    {formatNumber.format(balance)} SOL
                  </span>
                  &nbsp;
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    {formatUSD.format(balanceInUSD)}
                  </span>
                  &nbsp;
                </div>
                <div
                  style={{
                    display: 'flex',
                    marginBottom: 10,
                  }}
                >
                  &nbsp;&nbsp;
                  <Button
                    className="metaplex-button-default"
                    onClick={disconnect}
                    style={btnStyle}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            }
          />
        }
      >
        <Button className="wallet-key">
          {name && (
            <span
              style={{
                marginLeft: '0.5rem',
                fontWeight: 600,
              }}
            >
              {name}
            </span>
          )}
        </Button>
      </Popover>
    </div>
  );
};

export const Cog = () => {
  const { endpoint } = useConnectionConfig();
  const routerSearchParams = useQuerySearch();
  const { setVisible } = useWalletModal();
  const open = useCallback(() => setVisible(true), [setVisible]);

  return (
    <div className="wallet-wrapper">
      <Popover
        trigger="click"
        placement="bottomRight"
        content={
          <div
            style={{
              width: 250,
            }}
          >
            <h5
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.02em',
              }}
            >
              NETWORK
            </h5>
            <Select
              onSelect={network => {
                // Reload the page, forward user selection to the URL querystring.
                // The app will be re-initialized with the correct network
                // (which will also be saved to local storage for future visits)
                // for all its lifecycle.

                // Because we use react-router's HashRouter, we must append
                // the query parameters to the window location's hash & reload
                // explicitly. We cannot update the window location's search
                // property the standard way, see examples below.

                // doesn't work: https://localhost/?network=devnet#/
                // works: https://localhost/#/?network=devnet
                const windowHash = window.location.hash;
                routerSearchParams.set('network', network);
                const nextLocationHash = `${
                  windowHash.split('?')[0]
                }?${routerSearchParams.toString()}`;
                window.location.hash = nextLocationHash;
                window.location.reload();
              }}
              value={endpoint.name}
              bordered={false}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                width: '100%',
                marginBottom: 10,
              }}
            >
              {ENDPOINTS.map(({ name }) => (
                <Select.Option value={name} key={endpoint.name}>
                  {name}
                </Select.Option>
              ))}
            </Select>

            <Button
              className="metaplex-button-default"
              style={btnStyle}
              onClick={open}
            >
              Change wallet
            </Button>
          </div>
        }
      >
        <Button className="wallet-key">
          <img src="/cog.svg" />
        </Button>
      </Popover>
    </div>
  );
};

export const CurrentUserBadgeMobile = (props: {
  showBalance?: boolean;
  showAddress?: boolean;
  iconSize?: number;
  closeModal?: any;
}) => {
  const { wallet, publicKey, disconnect } = useWallet();
  const { account } = useNativeAccount();
  const solPrice = useSolPrice();

  if (!wallet || !publicKey) {
    return null;
  }
  const balance = (account?.lamports || 0) / LAMPORTS_PER_SOL;
  const balanceInUSD = balance * solPrice;

  const iconStyle: React.CSSProperties = {
    display: 'flex',
    width: props.iconSize,
    borderRadius: 50,
  };

  let name = props.showAddress ? shortenAddress(`${publicKey}`) : '';
  const unknownWallet = wallet as any;
  if (unknownWallet.name && !props.showAddress) {
    name = unknownWallet.name;
  }

  let image = <Identicon address={publicKey?.toBase58()} style={iconStyle} />;

  if (unknownWallet.image) {
    image = <img src={unknownWallet.image} style={iconStyle} />;
  }

  return (
    <div className="current-user-mobile-badge">
      <div className="mobile-badge">
        {image}
        {name && (
          <span
            style={{
              marginLeft: '0.5rem',
              fontWeight: 600,
            }}
          >
            {name}
          </span>
        )}
      </div>
      <div className="balance-container">
        <span className="balance-title">Balance</span>
        <span>
          <span className="sol-img-wrapper">
            <img src="/sol.svg" width="10" />
          </span>{' '}
          {formatNumber.format(balance)}&nbsp;&nbsp; SOL{' '}
          <span
            style={{
              marginLeft: 5,
              fontWeight: 'normal',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {formatUSD.format(balanceInUSD)}
          </span>
        </span>
      </div>
      <div className="actions-buttons">
        &nbsp;&nbsp;
        <Button className="black-btn" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    </div>
  );
};
