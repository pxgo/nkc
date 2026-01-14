export interface IConfigs {
  account: {
    username: string;
    password: string;
  };
  aliAppCode: string;
  alipay: {
    transfer: {
      appId: string;
      url: string;
      alipayCertPublicKeyPath: string;
      alipayRootCertPath: string;
      appCertPublicKeyPath: string;
      privateKeyPath: string;
    };
    receipt: {
      url: string;
      sellerId: string;
      sellerEmail: string;
      key: string;
      notifyUrl: string;
    };
  };
  wechatPay: {
    appId: string;
    mchId: string;
    orderTimeout: number;
    certFilePath: string;
    certNumber: string;
    nativeUrl: string;
    H5Url: string;
    APIv3: string;
    notifyUrl: string;
  };
  attachment: Array<{
    startingTime: string;
    endTime: string;
    url: string;
  }>;
  backup: {
    folder: string;
    time: string;
  };
  moleculer: {
    namespace: string;
    nodeID: string;
    transporter: string;
    registry: {
      strategy: string;
      discoverer: string;
    };
    web: {
      enabled: boolean;
      port: number;
      host: string;
    };
  };
  cookie: {
    secret: string;
    experimentalSecret: string;
    proxySecret: string;
    maxAge: number;
  };
  doi: {
    doiPrefix: string;
    username: string;
    password: string;
    role: string;
    postUrl: string;
    email: string;
  };
  elasticSearch: {
    address: string;
    port: number;
    username: string;
    password: string;
    indexName: string;
    analyzer: string;
    searchAnalyzer: string;
  };
  error: {
    notFound: string;
    internalServerError: string;
  };
  llm: {
    baseURL: string;
    apiKey: string;
    model: string;
  };
  mongodb: {
    address: string;
    port: number;
    database: string;
    username: string;
    password: string;
    poolSize: number;
    keepAlive: number;
    url: string;
  };
  pdfPreview: {
    maxGetPageScale: number;
    maxGetPageCount: number;
  };
  redis: {
    address: string;
    port: number;
    password: string;
    db: number;
  };
  server: {
    address: string;
    port: number;
    domain: string;
    reserveDomain: string[];
    maxIpsCount: number;
    proxy: boolean;
    domainWhitelist: string[];
    fileDomain: string;
  };
  store: {
    port: number;
    attachment: Array<{
      startingTime: string;
      endTime: string;
      path: string;
    }>;
  };
  transfer: {
    operatorId: number[];
  };
  upload: {
    maxFileSize: number;
  };
  geo: {
    dbFilePath: string;
  };
}
