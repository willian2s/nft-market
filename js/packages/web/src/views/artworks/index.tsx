import { useWallet } from '@solana/wallet-adapter-react';
import React, { useEffect, useState } from 'react';
import { Layout, Row, Col, Tabs } from 'antd';
import { useMeta } from '../../contexts';
import { CardLoader } from '../../components/MyLoader';

import { ArtworkViewState } from './types';
import { useItems } from './hooks/useItems';
import ItemCard from './components/ItemCard';
import { useStore, useUserAccounts } from '@oyster/common';
import { isMetadata, isPack } from './utils';
import { SetupView } from './setup';

const { TabPane } = Tabs;
const { Content } = Layout;

export const ArtworksView = () => {
  const { connected } = useWallet();
  const { isLoading, pullItemsPage, isFetching, store } = useMeta();
  const { isConfigured } = useStore();
  const { userAccounts } = useUserAccounts();

  const showArts = (store && isConfigured) || isLoading;

  const [activeKey, setActiveKey] = useState(ArtworkViewState.Metaplex);

  const userItems = useItems({ activeKey });

  useEffect(() => {
    if (!isFetching) {
      pullItemsPage(userAccounts);
    }
  }, [isFetching]);

  useEffect(() => {
    if (connected) {
      setActiveKey(ArtworkViewState.Owned);
    } else {
      setActiveKey(ArtworkViewState.Metaplex);
    }
  }, [connected, setActiveKey]);

  const isDataLoading = isLoading;

  const artworkGrid = (
    <div className="artwork-grid">
      {isDataLoading &&
        [...Array(10)].map((_, idx) => <CardLoader key={idx} />)}
      {!isDataLoading &&
        userItems
          .map(item => {
            const pubkey = isMetadata(item)
              ? item.pubkey
              : isPack(item)
              ? item.provingProcessKey
              : item.edition?.pubkey || item.metadata.pubkey;

            return <ItemCard item={item} key={pubkey} />;
          })
          .reverse()}
    </div>
  );

  return (
    <Layout style={{ margin: 0, marginTop: 30 }}>
      {showArts ? (
        <Content style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Col style={{ width: '100%', marginTop: 10 }}>
            <Row>
              <Tabs
                activeKey={activeKey}
                onTabClick={key => setActiveKey(key as ArtworkViewState)}
              >
                <TabPane
                  tab={<span className="tab-title">Todos</span>}
                  key={ArtworkViewState.Metaplex}
                >
                  {artworkGrid}
                </TabPane>
                {connected && (
                  <TabPane
                    tab={<span className="tab-title">Meus</span>}
                    key={ArtworkViewState.Owned}
                  >
                    {artworkGrid}
                  </TabPane>
                )}
                {connected && (
                  <TabPane
                    tab={<span className="tab-title">Criados</span>}
                    key={ArtworkViewState.Created}
                  >
                    {artworkGrid}
                  </TabPane>
                )}
              </Tabs>
            </Row>
          </Col>
        </Content>
      ) : (
        <SetupView />
      )}
    </Layout>
  );
};
