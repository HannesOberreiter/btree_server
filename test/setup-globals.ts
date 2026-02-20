declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var demoUser: {
    email: string
    password: string
    name: string
    lang: string
    newsletter: boolean
    source: string
  };
}

globalThis.demoUser = {
  email: 'test@btree.at',
  password: 'test_btree',
  name: 'Test Beekeeper',
  lang: 'en',
  newsletter: false,
  source: '0',
};
