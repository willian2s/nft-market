import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Menu, Modal } from 'antd';
import { useWallet } from '@solana/wallet-adapter-react';
import useWindowDimensions from '../../utils/layout';
import { MenuOutlined } from '@ant-design/icons';
import {
  Cog,
  CurrentUserBadge,
  CurrentUserBadgeMobile,
} from '../CurrentUserBadge';
import { ConnectButton } from '@oyster/common';
import { MobileNavbar } from '../MobileNavbar';

const getDefaultLinkActions = () => {
  return [
    <Link to={`/`} key={'artwork'}>
      <Button className="app-btn">NFTs</Button>
    </Link>,
    <Link to={`/art/create`} key={'artists'}>
      <Button className="app-btn">Criar NFT</Button>
    </Link>,
  ];
};

const DefaultActions = ({ vertical = false }: { vertical?: boolean }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
      }}
    >
      {getDefaultLinkActions()}
    </div>
  );
};

export const MetaplexMenu = () => {
  const { width } = useWindowDimensions();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { connected } = useWallet();

  if (width < 768)
    return (
      <>
        <Modal
          title={<img src={'/ace1-logo.svg'} />}
          visible={isModalVisible}
          footer={null}
          className={'modal-box'}
          closeIcon={
            <img
              onClick={() => setIsModalVisible(false)}
              src={'/modals/close.svg'}
            />
          }
        >
          <div className="site-card-wrapper mobile-menu-modal">
            <Menu onClick={() => setIsModalVisible(false)}>
              {getDefaultLinkActions().map((item, idx) => (
                <Menu.Item key={idx}>{item}</Menu.Item>
              ))}
            </Menu>
            <div className="actions">
              {!connected ? (
                <div className="actions-buttons">
                  <ConnectButton
                    onClick={() => setIsModalVisible(false)}
                    className="secondary-btn"
                  />
                </div>
              ) : (
                <>
                  <CurrentUserBadgeMobile
                    showBalance={false}
                    showAddress={true}
                    iconSize={24}
                    closeModal={() => {
                      setIsModalVisible(false);
                    }}
                  />
                  <Cog />
                </>
              )}
            </div>
          </div>
        </Modal>
        <MenuOutlined
          onClick={() => setIsModalVisible(true)}
          style={{ fontSize: '1.4rem' }}
        />
      </>
    );

  return <DefaultActions />;
};

export const LogoLink = () => {
  return (
    <Link to={`/`}>
      <img src={'/ace1-logo.svg'} />
    </Link>
  );
};

export const AppBar = () => {
  const { connected } = useWallet();
  return (
    <>
      <MobileNavbar />
      <div id="desktop-navbar">
        <div className="app-left">
          <LogoLink />
          &nbsp;&nbsp;&nbsp;
          <MetaplexMenu />
        </div>
        <div className="app-right app-bar-box">
          {!connected && (
            <ConnectButton style={{ height: 48 }} allowWalletChange />
          )}
          {connected && (
            <>
              <CurrentUserBadge
                showBalance={false}
                showAddress={true}
                iconSize={24}
              />
              <Cog />
            </>
          )}
        </div>
      </div>
    </>
  );
};
