import React, { useEffect, useState, useCallback } from 'react';
import {
  Steps,
  Row,
  Button,
  Upload,
  Col,
  Input,
  Statistic,
  Slider,
  Spin,
  InputNumber,
  Form,
  Typography,
  Space,
  Card,
  Checkbox,
} from 'antd';
import { ArtCard } from './../../components/ArtCard';
import { UserSearch, UserValue } from './../../components/UserSearch';
import { Confetti } from './../../components/Confetti';
import { mintNFT } from '../../actions';
import {
  MAX_METADATA_LEN,
  useConnection,
  IMetadataExtension,
  MetadataCategory,
  useConnectionConfig,
  Creator,
  shortenAddress,
  MetaplexModal,
  MetaplexOverlay,
  MetadataFile,
  StringPublicKey,
  WRAPPED_SOL_MINT,
  getAssetCostToStore,
  LAMPORT_MULTIPLIER,
} from '@oyster/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';
import { useHistory, useParams } from 'react-router-dom';
import { getLast } from '../../utils/utils';
import { AmountLabel } from '../../components/AmountLabel';
import useWindowDimensions from '../../utils/layout';
import {
  LoadingOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTokenList } from '../../contexts/tokenList';
import { SafetyDepositDraft } from '../../actions/createAuctionManager';
import { ArtSelector } from '../auctionCreate/artSelector';

const { Step } = Steps;
const { Dragger } = Upload;
const { Text } = Typography;

export const ArtCreateView = () => {
  const connection = useConnection();
  const { endpoint } = useConnectionConfig();
  const wallet = useWallet();
  const [alertMessage, setAlertMessage] = useState<string>();
  const { step_param }: { step_param: string } = useParams();
  const history = useHistory();
  const { width } = useWindowDimensions();
  const [nftCreateProgress, setNFTcreateProgress] = useState<number>(0);

  const [step, setStep] = useState<number>(0);
  const [stepsVisible, setStepsVisible] = useState<boolean>(true);
  const [isMinting, setMinting] = useState<boolean>(false);
  const [nft, setNft] = useState<
    { metadataAccount: StringPublicKey } | undefined
  >(undefined);
  const [files, setFiles] = useState<File[]>([]);
  const [isCollection, setIsCollection] = useState<boolean>(false);
  const [attributes, setAttributes] = useState<IMetadataExtension>({
    name: '',
    symbol: '',
    collection: '',
    description: '',
    external_url: '',
    image: '',
    animation_url: undefined,
    attributes: undefined,
    seller_fee_basis_points: 0,
    creators: [],
    properties: {
      files: [],
      category: MetadataCategory.Image,
    },
  });

  const gotoStep = useCallback(
    (_step: number) => {
      history.push(`/art/create/${_step.toString()}`);
      if (_step === 0) setStepsVisible(true);
    },
    [history],
  );

  useEffect(() => {
    if (step_param) setStep(parseInt(step_param));
    else gotoStep(0);
  }, [step_param, gotoStep]);

  // store files
  const mint = async () => {
    const metadata = {
      name: attributes.name,
      symbol: attributes.symbol,
      creators: attributes.creators,
      collection: attributes.collection,
      description: attributes.description,
      sellerFeeBasisPoints: attributes.seller_fee_basis_points,
      image: attributes.image,
      animation_url: attributes.animation_url,
      attributes: attributes.attributes,
      external_url: attributes.external_url,
      properties: {
        files: attributes.properties.files,
        category: attributes.properties?.category,
      },
    };
    setStepsVisible(false);
    setMinting(true);

    try {
      const _nft = await mintNFT(
        connection,
        wallet,
        endpoint.name,
        files,
        metadata,
        setNFTcreateProgress,
        attributes.properties?.maxSupply,
      );

      if (_nft) setNft(_nft);
      setAlertMessage('');
    } catch (e: any) {
      setAlertMessage(e.message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <>
      <Row className={'creator-base-page'} style={{ paddingTop: 50 }}>
        {stepsVisible && (
          <Col span={24} md={4}>
            <Steps
              progressDot
              direction={width < 768 ? 'horizontal' : 'vertical'}
              current={step}
              style={{
                width: 'fit-content',
                margin: '0 auto 30px auto',
                overflowX: 'auto',
                maxWidth: '100%',
              }}
            >
              <Step title="Categoria" />
              <Step title="Upload" />
              <Step title="Info" />
              <Step title="Royalties" />
              <Step title="Criar" />
            </Steps>
          </Col>
        )}
        <Col span={24} {...(stepsVisible ? { md: 20 } : { md: 24 })}>
          {step === 0 && (
            <CategoryStep
              confirm={(category: MetadataCategory) => {
                setAttributes({
                  ...attributes,
                  properties: {
                    ...attributes.properties,
                    category,
                  },
                });
                gotoStep(1);
              }}
            />
          )}
          {step === 1 && (
            <UploadStep
              attributes={attributes}
              setAttributes={setAttributes}
              files={files}
              setFiles={setFiles}
              confirm={() => gotoStep(2)}
            />
          )}

          {step === 2 && (
            <InfoStep
              attributes={attributes}
              files={files}
              isCollection={isCollection}
              setIsCollection={setIsCollection}
              setAttributes={setAttributes}
              confirm={() => gotoStep(3)}
            />
          )}
          {step === 3 && (
            <RoyaltiesStep
              attributes={attributes}
              confirm={() => gotoStep(4)}
              setAttributes={setAttributes}
            />
          )}
          {step === 4 && (
            <LaunchStep
              attributes={attributes}
              files={files}
              confirm={() => gotoStep(5)}
              connection={connection}
            />
          )}
          {step === 5 && (
            <WaitingStep
              mint={mint}
              minting={isMinting}
              step={nftCreateProgress}
              confirm={() => gotoStep(6)}
            />
          )}
          {0 < step && step < 5 && (
            <div style={{ margin: 'auto', width: 'fit-content' }}>
              <Button
                className="attr-button"
                onClick={() => gotoStep(step - 1)}
              >
                Voltar
              </Button>
            </div>
          )}
        </Col>
      </Row>
      <MetaplexOverlay visible={step === 6}>
        <Congrats nft={nft} alert={alertMessage} />
      </MetaplexOverlay>
    </>
  );
};

const CategoryStep = (props: {
  confirm: (category: MetadataCategory) => void;
}) => {
  const { width } = useWindowDimensions();
  return (
    <>
      <Row className="call-to-action">
        <h2>Criar novo NFT</h2>
      </Row>
      <Row justify={width < 768 ? 'center' : 'start'}>
        <Col>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(MetadataCategory.Image)}
            >
              <div>
                <div>Imagem</div>
                <div className="type-btn-description">JPG, PNG, GIF</div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(MetadataCategory.Video)}
            >
              <div>
                <div>Video</div>
                <div className="type-btn-description">MP4, MOV</div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(MetadataCategory.Audio)}
            >
              <div>
                <div>Audio</div>
                <div className="type-btn-description">MP3, WAV, FLAC</div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(MetadataCategory.VR)}
            >
              <div>
                <div>AR/3D</div>
                <div className="type-btn-description">GLB</div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(MetadataCategory.HTML)}
            >
              <div>
                <div>Arquivo HTML</div>
                <div className="type-btn-description">HTML</div>
              </div>
            </Button>
          </Row>
        </Col>
      </Row>
    </>
  );
};

const UploadStep = (props: {
  attributes: IMetadataExtension;
  setAttributes: (attr: IMetadataExtension) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  confirm: () => void;
}) => {
  const [coverFile, setCoverFile] = useState<File | undefined>(
    props.files?.[0],
  );
  const [mainFile, setMainFile] = useState<File | undefined>(props.files?.[1]);
  const [coverArtError, setCoverArtError] = useState<string>();

  const [customURL, setCustomURL] = useState<string>('');
  const [customURLErr, setCustomURLErr] = useState<string>('');
  const disableContinue = !(coverFile || (!customURLErr && !!customURL));

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      properties: {
        ...props.attributes.properties,
        files: [],
      },
    });
  }, []);

  const uploadMsg = (category: MetadataCategory) => {
    switch (category) {
      case MetadataCategory.Audio:
        return 'Carregue um arquivo de áudio (MP3, FLAC, WAV)';
      case MetadataCategory.Image:
        return 'Carregue um arquivo de imagem (PNG, JPG, GIF)';
      case MetadataCategory.Video:
        return 'Carregue um arquivo de vídeo (MP4, MOV, GLB)';
      case MetadataCategory.VR:
        return 'Carregue um arquivo de AR/VR (GLB)';
      case MetadataCategory.HTML:
        return 'Carregue um arquivo de HTML (HTML)';
      default:
        return 'Por favor, volte e escolha uma categoria';
    }
  };

  const acceptableFiles = (category: MetadataCategory) => {
    switch (category) {
      case MetadataCategory.Audio:
        return '.mp3,.flac,.wav';
      case MetadataCategory.Image:
        return '.png,.jpg,.gif';
      case MetadataCategory.Video:
        return '.mp4,.mov,.webm';
      case MetadataCategory.VR:
        return '.glb';
      case MetadataCategory.HTML:
        return '.html';
      default:
        return '';
    }
  };

  return (
    <>
      <Row className="call-to-action">
        <h2>Agora, vamos carregar seu arquivo</h2>
        <p style={{ fontSize: '1.2rem' }}>
          Seu arquivo será carregado para a web descentralizada via Arweave.
          Dependendo do tipo de arquivo, pode levar até 1 minuto. Arweave é um
          novo tipo de armazenamento que apóia dados sustentáveis e perpétuos,
          permitindo que usuários e desenvolvedores realmente armazenem dados
          para sempre.
        </p>
      </Row>
      <Row className="content-action">
        <h3>Carregue um arquivo de imagem (PNG, JPG, GIF, SVG)</h3>
        <Dragger
          accept=".png,.jpg,.gif,.mp4,.svg"
          style={{ padding: 20, background: 'rgba(255, 255, 255, 0.08)' }}
          multiple={false}
          onRemove={() => {
            setMainFile(undefined);
            setCoverFile(undefined);
          }}
          customRequest={info => {
            // dont upload files here, handled outside of the control
            info?.onSuccess?.({}, null as any);
          }}
          fileList={coverFile ? [coverFile as any] : []}
          onChange={async info => {
            const file = info.file.originFileObj;

            if (!file) {
              return;
            }

            const sizeKB = file.size / 1024;

            if (sizeKB < 25) {
              setCoverArtError(
                `The file ${file.name} is too small. It is ${
                  Math.round(10 * sizeKB) / 10
                }KB but should be at least 25KB.`,
              );
              return;
            }

            setCoverFile(file);
            setCoverArtError(undefined);
          }}
        >
          <div className="ant-upload-drag-icon">
            <h3 style={{ fontWeight: 700 }}>
              Carregue um arquivo de imagem (PNG, JPG, GIF, SVG)
            </h3>
          </div>
          {coverArtError ? (
            <Text type="danger">{coverArtError}</Text>
          ) : (
            <p className="ant-upload-text" style={{ color: '#6d6d6d' }}>
              Arraste e solte ou clique para navegar
            </p>
          )}
        </Dragger>
      </Row>
      {props.attributes.properties?.category !== MetadataCategory.Image && (
        <Row
          className="content-action"
          style={{ marginBottom: 5, marginTop: 30 }}
        >
          <h3>{uploadMsg(props.attributes.properties?.category)}</h3>
          <Dragger
            accept={acceptableFiles(props.attributes.properties?.category)}
            style={{ padding: 20, background: 'rgba(255, 255, 255, 0.08)' }}
            multiple={false}
            customRequest={info => {
              // dont upload files here, handled outside of the control
              info?.onSuccess?.({}, null as any);
            }}
            fileList={mainFile ? [mainFile as any] : []}
            onChange={async info => {
              const file = info.file.originFileObj;

              // Reset image URL
              setCustomURL('');
              setCustomURLErr('');

              if (file) setMainFile(file);
            }}
            onRemove={() => {
              setMainFile(undefined);
            }}
          >
            <div className="ant-upload-drag-icon">
              <h3 style={{ fontWeight: 700 }}>Carregue um arquivo</h3>
            </div>
            <p className="ant-upload-text" style={{ color: '#6d6d6d' }}>
              Arraste e solte ou clique para navegar
            </p>
          </Dragger>
        </Row>
      )}
      <Row>
        <Button
          type="primary"
          size="large"
          disabled={disableContinue}
          onClick={async () => {
            props.setAttributes({
              ...props.attributes,
              properties: {
                ...props.attributes.properties,
                files: [coverFile, mainFile, customURL]
                  .filter(f => f)
                  .map(f => {
                    const uri = typeof f === 'string' ? f : f?.name || '';
                    const type =
                      typeof f === 'string' || !f
                        ? 'unknown'
                        : f.type || getLast(f.name.split('.')) || 'unknown';

                    return {
                      uri,
                      type,
                    } as MetadataFile;
                  }),
              },
              image: coverFile?.name || customURL || '',
              animation_url:
                props.attributes.properties?.category !==
                  MetadataCategory.Image && customURL
                  ? customURL
                  : mainFile && mainFile.name,
            });
            const url = await fetch(customURL).then(res => res.blob());
            const files = [
              coverFile,
              mainFile,
              customURL ? new File([url], customURL) : '',
            ].filter(f => f) as File[];

            props.setFiles(files);
            props.confirm();
          }}
          style={{ marginTop: 34 }}
          className="action-btn"
        >
          Continue para Info
        </Button>
      </Row>
    </>
  );
};

interface Royalty {
  creatorKey: string;
  amount: number;
}

const useArtworkFiles = (files: File[], attributes: IMetadataExtension) => {
  const [data, setData] = useState<{ image: string; animation_url: string }>({
    image: '',
    animation_url: '',
  });

  useEffect(() => {
    if (attributes.image) {
      const file = files.find(f => f.name === attributes.image);
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          setData((data: any) => {
            return {
              ...(data || {}),
              image: (event.target?.result as string) || '',
            };
          });
        };
        if (file) reader.readAsDataURL(file);
      }
    }

    if (attributes.animation_url) {
      const file = files.find(f => f.name === attributes.animation_url);
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          setData((data: any) => {
            return {
              ...(data || {}),
              animation_url: (event.target?.result as string) || '',
            };
          });
        };
        if (file) reader.readAsDataURL(file);
      }
    }
  }, [files, attributes]);

  return data;
};

const InfoStep = (props: {
  attributes: IMetadataExtension;
  files: File[];
  isCollection: boolean;
  setIsCollection: (val: boolean) => void;
  setAttributes: (attr: IMetadataExtension) => void;
  confirm: () => void;
}) => {
  const { image } = useArtworkFiles(props.files, props.attributes);
  const [form] = Form.useForm();
  const { isCollection, setIsCollection } = props;
  const [selectedCollection, setSelectedCollection] = useState<
    Array<SafetyDepositDraft>
  >([]);

  const artistFilter = useCallback(
    (i: SafetyDepositDraft) =>
      !(i.metadata.info.data.creators || []).some((c: Creator) => !c.verified),
    [],
  );

  useEffect(() => {
    if (selectedCollection.length) {
      props.setAttributes({
        ...props.attributes,
        collection: selectedCollection[0].metadata.info.mint,
      });
    }
  }, [selectedCollection]);

  return (
    <>
      <Row className="call-to-action">
        <h2>Informações do NFT</h2>
        <p>Forneça maiores informações sobre NFT.</p>
      </Row>
      <Row className="content-action" justify="space-around">
        <Col>
          {props.attributes.image && (
            <ArtCard
              image={image}
              animationURL={props.attributes.animation_url}
              category={props.attributes.properties?.category}
              name={props.attributes.name}
              symbol={props.attributes.symbol}
              small={true}
              artView={!(props.files.length > 1)}
              className="art-create-card"
            />
          )}
        </Col>
        <Col className="section" style={{ minWidth: 300 }}>
          <label className="action-field">
            <span className="field-title">Título</span>
            <Input
              autoFocus
              className="input"
              placeholder="Max 50 caractéres"
              maxLength={50}
              allowClear
              value={props.attributes.name}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  name: info.target.value,
                })
              }
            />
          </label>
          <label className="action-field">
            <span className="field-title">Símbolo</span>
            <Input
              className="input"
              placeholder="Max 10 caractéres"
              maxLength={10}
              allowClear
              value={props.attributes.symbol}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  symbol: info.target.value,
                })
              }
            />
          </label>
          <label className="action-field direction-row">
            <Checkbox
              checked={isCollection}
              onChange={val => {
                setIsCollection(val.target.checked);
              }}
            />
            <span className="field-title" style={{ marginLeft: '10px' }}>
              É coleção de pai?
            </span>
          </label>
          {!isCollection && (
            <label className="action-field">
              <span className="field-title">Coleção</span>
              <ArtSelector
                filter={artistFilter}
                selected={selectedCollection}
                setSelected={items => {
                  setSelectedCollection(items);
                }}
                allowMultiple={false}
              >
                Selecione o NFT
              </ArtSelector>
            </label>
          )}
          <label className="action-field">
            <span className="field-title">Descrição</span>
            <Input.TextArea
              className="input textarea"
              placeholder="Max 500 caractéres"
              maxLength={500}
              value={props.attributes.description}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  description: info.target.value,
                })
              }
              allowClear
            />
          </label>
          {!isCollection && (
            <label className="action-field">
              <span className="field-title">
                Suprimento Máximo (para único, deixar vázio)
              </span>
              <InputNumber
                placeholder="Qauntidade"
                value={props.attributes.properties.maxSupply}
                onChange={(val: number) => {
                  props.setAttributes({
                    ...props.attributes,
                    properties: {
                      ...props.attributes.properties,
                      maxSupply: val,
                    },
                  });
                }}
                className="royalties-input"
              />
            </label>
          )}
          <label className="action-field">
            <span className="field-title">Atributos</span>
          </label>
          <Form name="dynamic_attributes" form={form} autoComplete="off">
            <Form.List name="attributes">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Space key={key} align="baseline">
                      <Form.Item name={[name, 'trait_type']} hasFeedback>
                        <Input placeholder="trait_type (Optional)" />
                      </Form.Item>
                      <Form.Item
                        name={[name, 'value']}
                        rules={[{ required: true, message: 'Missing value' }]}
                        hasFeedback
                      >
                        <Input placeholder="value" />
                      </Form.Item>
                      <Form.Item name={[name, 'display_type']} hasFeedback>
                        <Input placeholder="display_type (Optional)" />
                      </Form.Item>
                      <MinusCircleOutlined
                        className="icon-remove"
                        onClick={() => remove(name)}
                      />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      className="ant-btn attr-button"
                    >
                      Adicionar atributo
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        </Col>
      </Row>

      <Row>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            form.validateFields().then(values => {
              const nftAttributes = values.attributes;
              // value is number if possible
              for (const nftAttribute of nftAttributes || []) {
                const newValue = Number(nftAttribute.value);
                if (!isNaN(newValue)) {
                  nftAttribute.value = newValue;
                }
              }
              console.log('Adding NFT attributes:', nftAttributes);
              props.setAttributes({
                ...props.attributes,
                attributes: nftAttributes,
              });

              props.confirm();
            });
          }}
          className="action-btn"
        >
          Continue para royalties
        </Button>
      </Row>
    </>
  );
};

const RoyaltiesSplitter = (props: {
  creators: Array<UserValue>;
  royalties: Array<Royalty>;
  setRoyalties: Function;
  isShowErrors?: boolean;
}) => {
  return (
    <Col>
      <Row gutter={[0, 24]}>
        {props.creators.map((creator, idx) => {
          const royalty = props.royalties.find(
            royalty => royalty.creatorKey === creator.key,
          );
          if (!royalty) return null;

          const amt = royalty.amount;

          const handleChangeShare = (newAmt: number) => {
            props.setRoyalties(
              props.royalties.map(_royalty => {
                return {
                  ..._royalty,
                  amount:
                    _royalty.creatorKey === royalty.creatorKey
                      ? newAmt
                      : _royalty.amount,
                };
              }),
            );
          };

          return (
            <Col span={24} key={idx}>
              <Row
                align="middle"
                gutter={[0, 16]}
                style={{ margin: '5px auto' }}
              >
                <Col span={4} style={{ padding: 10, color: '#008999' }}>
                  {creator.label}
                </Col>
                <Col span={3}>
                  <InputNumber<number>
                    min={0}
                    max={100}
                    formatter={value => `${value}%`}
                    value={amt}
                    parser={value => parseInt(value?.replace('%', '') ?? '0')}
                    onChange={handleChangeShare}
                    className="royalties-input"
                  />
                </Col>
                <Col span={4} style={{ paddingLeft: 12 }}>
                  <Slider value={amt} onChange={handleChangeShare} />
                </Col>
                {props.isShowErrors && amt === 0 && (
                  <Col style={{ paddingLeft: 12 }}>
                    <Text type="danger">
                      A porcentagem de divisão para este criador não pode ser
                      0%.
                    </Text>
                  </Col>
                )}
              </Row>
            </Col>
          );
        })}
      </Row>
    </Col>
  );
};

const RoyaltiesStep = (props: {
  attributes: IMetadataExtension;
  setAttributes: (attr: IMetadataExtension) => void;
  confirm: () => void;
}) => {
  // const file = props.attributes.image;
  const { publicKey, connected } = useWallet();
  const [creators, setCreators] = useState<Array<UserValue>>([]);
  const [fixedCreators, setFixedCreators] = useState<Array<UserValue>>([]);
  const [royalties, setRoyalties] = useState<Array<Royalty>>([]);
  const [totalRoyaltyShares, setTotalRoyaltiesShare] = useState<number>(0);
  const [showCreatorsModal, setShowCreatorsModal] = useState<boolean>(false);
  const [isShowErrors, setIsShowErrors] = useState<boolean>(false);

  useEffect(() => {
    if (publicKey) {
      const key = publicKey.toBase58();
      setFixedCreators([
        {
          key,
          label: shortenAddress(key),
          value: key,
        },
      ]);
    }
  }, [connected, setCreators]);

  useEffect(() => {
    setRoyalties(
      [...fixedCreators, ...creators].map(creator => ({
        creatorKey: creator.key,
        amount: Math.trunc(100 / [...fixedCreators, ...creators].length),
      })),
    );
  }, [creators, fixedCreators]);

  useEffect(() => {
    // When royalties changes, sum up all the amounts.
    const total = royalties.reduce((totalShares, royalty) => {
      return totalShares + royalty.amount;
    }, 0);

    setTotalRoyaltiesShare(total);
  }, [royalties]);

  return (
    <>
      <Row className="call-to-action" style={{ marginBottom: 20 }}>
        <h2>Definir royalties</h2>
        <p>
          Os royalties garantem que a ACE1 seja compensada após a transferencia
          de um NFT, em caso de venda futura.
        </p>
      </Row>
      <Row className="content-action" style={{ marginBottom: 20 }}>
        <label className="action-field">
          <span className="field-title">Porcentage de Royalty</span>
          <p>Este é o quanto de cada venda secundária será pago a ACE1</p>
          <InputNumber
            autoFocus
            min={0}
            max={100}
            placeholder="Entre 0 e 100"
            onChange={(val: number) => {
              props.setAttributes({
                ...props.attributes,
                seller_fee_basis_points: val * 100,
              });
            }}
            className="royalties-input"
          />
        </label>
      </Row>
      {[...fixedCreators, ...creators].length > 0 && (
        <Row>
          <label className="action-field" style={{ width: '100%' }}>
            <span className="field-title">Divisão por criador</span>
            <p>
              Este é o valor da venda inicial e quaisquer royalties serão
              divididos entre os criadores.
            </p>
            <RoyaltiesSplitter
              creators={[...fixedCreators, ...creators]}
              royalties={royalties}
              setRoyalties={setRoyalties}
              isShowErrors={isShowErrors}
            />
          </label>
        </Row>
      )}
      <Row>
        <span
          onClick={() => setShowCreatorsModal(true)}
          style={{ padding: 10, marginBottom: 10 }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 25,
              padding: '0px 8px 3px 8px',
              background: '#008999d9',
              borderRadius: '50%',
              marginRight: 5,
              verticalAlign: 'middle',
            }}
          >
            +
          </span>
          <span
            style={{
              color: '#008999',
              verticalAlign: 'middle',
              lineHeight: 1,
            }}
          >
            Adicionar outro criador.
          </span>
        </span>
        <MetaplexModal
          visible={showCreatorsModal}
          onCancel={() => setShowCreatorsModal(false)}
        >
          <label className="action-field" style={{ width: '100%' }}>
            <span className="field-title">Criadores</span>
            <UserSearch setCreators={setCreators} />
          </label>
        </MetaplexModal>
      </Row>
      {isShowErrors && totalRoyaltyShares !== 100 && (
        <Row>
          <Text type="danger" style={{ paddingBottom: 14 }}>
            As porcentagens de divisão para cada criador devem somar 100%. A
            porcentagem total atual de divisão é {totalRoyaltyShares}%.
          </Text>
        </Row>
      )}
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            // Find all royalties that are invalid (0)
            const zeroedRoyalties = royalties.filter(
              royalty => royalty.amount === 0,
            );

            if (zeroedRoyalties.length !== 0 || totalRoyaltyShares !== 100) {
              // Contains a share that is 0 or total shares does not equal 100, show errors.
              setIsShowErrors(true);
              return;
            }

            const creatorStructs: Creator[] = [
              ...fixedCreators,
              ...creators,
            ].map(
              c =>
                new Creator({
                  address: c.value,
                  verified: c.value === publicKey?.toBase58(),
                  share:
                    royalties.find(r => r.creatorKey === c.value)?.amount ||
                    Math.round(100 / royalties.length),
                }),
            );

            const share = creatorStructs.reduce(
              (acc, el) => (acc += el.share),
              0,
            );
            if (share > 100 && creatorStructs.length) {
              creatorStructs[0].share -= share - 100;
            }
            props.setAttributes({
              ...props.attributes,
              creators: creatorStructs,
            });
            props.confirm();
          }}
          className="action-btn"
        >
          Continue para revisar
        </Button>
      </Row>
    </>
  );
};

const LaunchStep = (props: {
  confirm: () => void;
  attributes: IMetadataExtension;
  files: File[];
  connection: Connection;
}) => {
  const [cost, setCost] = useState(0);
  const { image } = useArtworkFiles(props.files, props.attributes);
  const files = props.files;
  const metadata = props.attributes;
  useEffect(() => {
    const rentCall = Promise.all([
      props.connection.getMinimumBalanceForRentExemption(MintLayout.span),
      props.connection.getMinimumBalanceForRentExemption(MAX_METADATA_LEN),
    ]);
    if (files.length)
      getAssetCostToStore([
        ...files,
        new File([JSON.stringify(metadata)], 'metadata.json'),
      ]).then(async lamports => {
        const sol = lamports / LAMPORT_MULTIPLIER;

        // TODO: cache this and batch in one call
        const [mintRent, metadataRent] = await rentCall;

        // const uriStr = 'x';
        // let uriBuilder = '';
        // for (let i = 0; i < MAX_URI_LENGTH; i++) {
        //   uriBuilder += uriStr;
        // }

        const additionalSol = (metadataRent + mintRent) / LAMPORT_MULTIPLIER;

        // TODO: add fees based on number of transactions and signers
        setCost(sol + additionalSol);
      });
  }, [files, metadata, setCost]);

  return (
    <>
      <Row className="call-to-action">
        <h2>Criar NFT</h2>
      </Row>
      <Row className="content-action" justify="space-around">
        <Col>
          {props.attributes.image && (
            <ArtCard
              image={image}
              animationURL={props.attributes.animation_url}
              category={props.attributes.properties?.category}
              name={props.attributes.name}
              symbol={props.attributes.symbol}
              small={true}
              artView={props.files[1]?.type === 'unknown'}
              className="art-create-card"
            />
          )}
        </Col>
        <Col className="section" style={{ minWidth: 300 }}>
          <Statistic
            className="create-statistic"
            title="Porcentagem Royalty"
            value={props.attributes.seller_fee_basis_points / 100}
            precision={2}
            suffix="%"
          />
          {cost ? (
            <AmountLabel
              title="Custo (Dólar)"
              amount={cost.toFixed(5)}
              tokenInfo={useTokenList().tokenMap.get(
                WRAPPED_SOL_MINT.toString(),
              )}
            />
          ) : (
            <Spin />
          )}
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
          style={{
            marginTop: 34,
          }}
        >
          Criar
        </Button>
      </Row>
    </>
  );
};

const WaitingStep = (props: {
  mint: Function;
  minting: boolean;
  confirm: Function;
  step: number;
}) => {
  useEffect(() => {
    const func = async () => {
      await props.mint();
      props.confirm();
    };
    func();
  }, []);

  const setIconForStep = (currentStep: number, componentStep) => {
    if (currentStep === componentStep) {
      return <LoadingOutlined />;
    }
    return null;
  };

  return (
    <div
      style={{
        marginTop: 70,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Card>
        <Steps direction="vertical" current={props.step}>
          <Step
            title="Criando"
            description="Iniciando Processo de Criação"
            icon={setIconForStep(props.step, 0)}
          />
          <Step
            title="Preparando Assets"
            icon={setIconForStep(props.step, 1)}
          />
          <Step
            title="Assinando Metadados da Transação"
            description="Aprove a transação pela sua carteira"
            icon={setIconForStep(props.step, 2)}
          />
          <Step
            title="Enviando Transação para Solana"
            description="Isso levará alguns segundos."
            icon={setIconForStep(props.step, 3)}
          />
          <Step
            title="Aguardando confirmação inicial"
            icon={setIconForStep(props.step, 4)}
          />
          <Step
            title="Aguardando a confirmação final"
            icon={setIconForStep(props.step, 5)}
          />
          <Step
            title="Carregando no Arweave"
            icon={setIconForStep(props.step, 6)}
          />
          <Step
            title="Atualizando metadados"
            icon={setIconForStep(props.step, 7)}
          />
          <Step
            title="Assinando Transação de Token"
            description="Aprove a transação final da sua carteira"
            icon={setIconForStep(props.step, 8)}
          />
        </Steps>
      </Card>
    </div>
  );
};

const Congrats = (props: {
  nft?: {
    metadataAccount: StringPublicKey;
  };
  alert?: string;
}) => {
  const history = useHistory();

  if (props.alert) {
    // TODO  - properly reset this components state on error
    return (
      <>
        <div className="waiting-title">Desculpe, houve um erro!</div>
        <p>{props.alert}</p>
        <Button onClick={() => history.push('/art/create')}>
          Voltar para Criar NFT
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="waiting-title">
        Parabéns, você criou um Certificado NFT!
      </div>
      <div className="congrats-button-container">
        <Button className="metaplex-button" onClick={() => history.push(`/`)}>
          <span>Retorne a página inicial</span>
          <span>&gt;</span>
        </Button>
      </div>
      <Confetti />
    </>
  );
};
