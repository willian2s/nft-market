import React from 'react';
import { Row, Col, Divider, Layout, Tag, Skeleton, List, Card } from 'antd';
import { useParams } from 'react-router-dom';
import { useArt, useExtendedArt } from '../../hooks';

import { ArtContent } from '../../components/ArtContent';
import { ViewOn } from '../../components/ViewOn';

const { Content } = Layout;

export const ArtView = () => {
  const { id } = useParams<{ id: string }>();
  const art = useArt(id);

  const { ref, data } = useExtendedArt(id);

  // const { userAccounts } = useUserAccounts();

  // const accountByMint = userAccounts.reduce((prev, acc) => {
  //   prev.set(acc.info.mint.toBase58(), acc);
  //   return prev;
  // }, new Map<string, TokenAccount>());

  const description = data?.description;
  const attributes = data?.attributes;

  const tag = (
    <div className="info-header">
      <Tag color="blue">UNVERIFIED</Tag>
    </div>
  );

  const unverified = (
    <>
      {tag}
      <div style={{ fontSize: 12 }}>
        <i>
          This artwork is still missing verification from{' '}
          {art.creators?.filter(c => !c.verified).length} contributors before it
          can be considered verified and sellable on the platform.
        </i>
      </div>
      <br />
    </>
  );

  return (
    <Content>
      <Col>
        <Row ref={ref}>
          <Col
            xs={{ span: 24 }}
            md={{ span: 12 }}
            style={{ paddingRight: '30px' }}
          >
            <ArtContent
              style={{ width: '100%', height: 'auto', margin: '0 auto' }}
              height={300}
              width={300}
              className="artwork-image"
              pubkey={id}
              active={true}
              allowMeshRender={true}
              artView={true}
            />
          </Col>
          {/* <Divider /> */}
          <Col
            xs={{ span: 24 }}
            md={{ span: 12 }}
            style={{ textAlign: 'left', fontSize: '1.4rem' }}
          >
            <Row>
              <div
                style={{ fontWeight: 700, fontSize: '2rem', color: '#008999' }}
              >
                {art.title || <Skeleton paragraph={{ rows: 0 }} />}
              </div>
            </Row>
            <Row>
              <Col span={6}>
                <h6 style={{ color: '#485156' }}>Royalties</h6>
                <div className="royalties">
                  {((art.seller_fee_basis_points || 0) / 100).toFixed(2)}%
                </div>
              </Col>
              <Col span={12}>
                <ViewOn id={id} />
              </Col>
            </Row>
            <Row>
              <Col style={{ width: '100%' }}>
                <Divider />
                {art.creators?.find(c => !c.verified) && unverified}
                <br />
                <div className="info-header">Descrição</div>
                <div className="info-content">{description}</div>
                <br />
              </Col>
            </Row>
            <Row>
              <Col style={{ width: '100%' }}>
                {attributes && (
                  <>
                    <Divider />
                    <br />
                    <div className="info-header">Attributos</div>
                    <List size="large" grid={{ column: 4 }}>
                      {attributes.map(attribute => (
                        <List.Item key={attribute.trait_type}>
                          <Card title={attribute.trait_type}>
                            {attribute.value}
                          </Card>
                        </List.Item>
                      ))}
                    </List>
                  </>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>
    </Content>
  );
};
