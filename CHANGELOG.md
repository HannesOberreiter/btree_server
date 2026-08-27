# Changelog

## [7.7.0](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.6.1...btree-server-v7.7.0) (2026-08-27)


### Features

* **pest:** import Austrian Velutina reports ([ac9c983](https://github.com/HannesOberreiter/btree_server/commit/ac9c9837c429f67133c025563ad56bfd5000e161))

## [7.6.1](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.6.0...btree-server-v7.6.1) (2026-08-16)


### Bug Fixes

* **query:** preserve table search text ([afc6c2f](https://github.com/HannesOberreiter/btree_server/commit/afc6c2f3ba777a6325af3d96b4ab96de694d68e8))
* **tables:** support sortable columns ([499d8c2](https://github.com/HannesOberreiter/btree_server/commit/499d8c20d8256ffbd21bb3cd876995f0e896dd74))

## [7.6.0](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.5.2...btree-server-v7.6.0) (2026-08-11)


### Features

* **charge:** add inventory adjustments ([21f10fd](https://github.com/HannesOberreiter/btree_server/commit/21f10fd53327e105933d63adf6e08a00862e8ee0))
* **wax:** add inventory corrections ([866bdaf](https://github.com/HannesOberreiter/btree_server/commit/866bdafd75d003f12e2a64f29b71db68b00065af))


### Bug Fixes

* **logging:** fingerprint iCal API keys ([526e999](https://github.com/HannesOberreiter/btree_server/commit/526e999c38c9f873dd81114898cfc5a3d92f0700))
* **logging:** log iCal 404s as info ([512acd8](https://github.com/HannesOberreiter/btree_server/commit/512acd81cba7534a2dcd979debb9330d6513f89b))
* **wax:** copy inventory notes to lots ([035ef8b](https://github.com/HannesOberreiter/btree_server/commit/035ef8b47dde058a45d3c71fc631e3a250b2bb52))

## [7.5.2](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.5.1...btree-server-v7.5.2) (2026-08-05)


### Bug Fixes

* **api:** restore migrated filters ([5e94440](https://github.com/HannesOberreiter/btree_server/commit/5e94440a3665be6022f8a2268e8752b0e9333279))

## [7.5.1](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.5.0...btree-server-v7.5.1) (2026-08-04)


### Performance

* **statistics:** query task-specific tables ([b94ec15](https://github.com/HannesOberreiter/btree_server/commit/b94ec15ec3e03101cd6ec6b4cb03867d3f93fec4))
* **statistics:** query task-specific tables ([559d80d](https://github.com/HannesOberreiter/btree_server/commit/559d80de16585c76ebf5030617fc3a0832b09749))

## [7.5.0](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.4.0...btree-server-v7.5.0) (2026-08-04)


### Features

* **api:** add schemas for remaining routes ([3f2e5e4](https://github.com/HannesOberreiter/btree_server/commit/3f2e5e4600405dc1033b2648fdede400fe39d942))
* **api:** publish Zod OpenAPI contracts ([6a19d6d](https://github.com/HannesOberreiter/btree_server/commit/6a19d6d433bf5e3c4649ea7295fe8aa1c8f67515))
* **wax:** add traceable wax ledger ([b8b2515](https://github.com/HannesOberreiter/btree_server/commit/b8b25159aa0cfd451a4301c01427bb6376e7465d))


### Bug Fixes

* **agent:** preserve tool recovery details ([b45ea3f](https://github.com/HannesOberreiter/btree_server/commit/b45ea3f01b012d2d76ac8e0debedb40cf3a67d18))
* **audit:** misc errors in payment and membership ([dd7a6db](https://github.com/HannesOberreiter/btree_server/commit/dd7a6dbcad6bb71619a9d4b026b355133a76cdbc))
* **auth:** enforce OAuth access policy ([83bdda8](https://github.com/HannesOberreiter/btree_server/commit/83bdda87a56d06212f4470f622e0e60a285f20b5))
* **auth:** enforce WizBee tool roles ([5a26bd7](https://github.com/HannesOberreiter/btree_server/commit/5a26bd7425910c84cd81bdea918bd1d7b8625dda))
* **security:** enforce location ownership ([33df903](https://github.com/HannesOberreiter/btree_server/commit/33df9037105c15257d34ba47a2dde19a02ef6667))


### Miscellaneous

* **agent-key:** replace model wrapper ([f399c72](https://github.com/HannesOberreiter/btree_server/commit/f399c725b1713c4bdfbb9392e27382f8dca2430a))
* **apiary:** migrate routes to Kysely ([c32552d](https://github.com/HannesOberreiter/btree_server/commit/c32552d3b356faaf41fd21adbd7f1ccbec09df5e))
* **api:** deepen domain modules ([b7c62b1](https://github.com/HannesOberreiter/btree_server/commit/b7c62b148b733e21045c17362e1ae1f0f1c343e5))
* **calendar:** migrate reads to Kysely ([3619b73](https://github.com/HannesOberreiter/btree_server/commit/3619b73c0d3d98365f3619d56c1c771bd9f1cf1d))
* **company:** migrate archive persistence ([3191232](https://github.com/HannesOberreiter/btree_server/commit/3191232bce155ebe168f84b8adfa64e718ba542b))
* **company:** migrate workspace operations ([0a32c04](https://github.com/HannesOberreiter/btree_server/commit/0a32c04444549360c2957a23c225307e850ee0ae))
* **db:** make Kysely types reproducible ([c05636f](https://github.com/HannesOberreiter/btree_server/commit/c05636f697b1c07438a13aea66cc46fdaf97b4e2))
* **db:** remove Objection runtime ([5a324b5](https://github.com/HannesOberreiter/btree_server/commit/5a324b56ba71a2276e8111453a65b0091d96aff5))
* **dropbox:** migrate persistence to Kysely ([c7fd328](https://github.com/HannesOberreiter/btree_server/commit/c7fd328a3cbf765ecfc74c9eab9d6c817ada7b46))
* **field-setting:** migrate routes to Kysely ([ee3ebf3](https://github.com/HannesOberreiter/btree_server/commit/ee3ebf369c81e51d0ff119dbca928da43a9d5064))
* **hive:** migrate CRUD to Kysely ([5f9244d](https://github.com/HannesOberreiter/btree_server/commit/5f9244d571771e4c3becaa3455c96d66f5109726))
* **identity:** migrate persistence to Kysely ([18cafc7](https://github.com/HannesOberreiter/btree_server/commit/18cafc715d5b51805205d841db57d8fcbb95e01c))
* **observations:** deepen Kysely operations ([ff93466](https://github.com/HannesOberreiter/btree_server/commit/ff9346699e1efceab0f9acb6043bb554f28ffcdb))
* **options:** migrate routes to Kysely ([96c1b5d](https://github.com/HannesOberreiter/btree_server/commit/96c1b5d3fdaa309c3b8c910db8199799f0d521a0))
* **payments:** remove Stripe integration ([d4a05e2](https://github.com/HannesOberreiter/btree_server/commit/d4a05e2697e42c9753a1b96dd4a53f132f342a42))
* **phase4:** migrate business slices to Kysely ([e52fdf1](https://github.com/HannesOberreiter/btree_server/commit/e52fdf152e25d0e6d65de522ce3a7da8f7d5de31))
* **scale-data:** migrate routes to Kysely ([ab4fe2a](https://github.com/HannesOberreiter/btree_server/commit/ab4fe2a8e77a389d011eba9c0c614615606cdfdd))
* **scale:** migrate routes to Kysely ([4d54a44](https://github.com/HannesOberreiter/btree_server/commit/4d54a44662f834b94813f6c9038f51373da299f8))
* **statistics:** migrate reads to Kysely ([738cf94](https://github.com/HannesOberreiter/btree_server/commit/738cf94daad2eae569b275352aeb383648d61f19))
* **tasks:** migrate routes to Kysely ([c9fd1bf](https://github.com/HannesOberreiter/btree_server/commit/c9fd1bffaa810d88f537c1462f6cbc0b5a2dc30d))
* **todo:** deepen Kysely operations ([b7e60fe](https://github.com/HannesOberreiter/btree_server/commit/b7e60fe49685b48feb99910c06161d5713e2547d))

## [7.4.0](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.3.1...btree-server-v7.4.0) (2026-07-20)


### Features

* **logging:** add container-ready logging ([ce45fa8](https://github.com/HannesOberreiter/btree_server/commit/ce45fa856dbdcd3cb0bdbbcf9c70e0f6eaef0b03))
* **wizbee:** manage apiaries, hives, movements ([e7089d1](https://github.com/HannesOberreiter/btree_server/commit/e7089d1cdbeec76c4d8a024890e829e2c04159b3))


### Bug Fixes

* **docker:** skip migrations in child containers ([f857414](https://github.com/HannesOberreiter/btree_server/commit/f857414167422121f2caf531b9a25e4bb809cac1))

## [7.3.1](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.3.0...btree-server-v7.3.1) (2026-06-12)


### Bug Fixes

* :bug: fix number string to number conversion ([c53ebe9](https://github.com/HannesOberreiter/btree_server/commit/c53ebe9143459631413b9dd9fb03432193c8b419))

## [7.3.0](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.2.0...btree-server-v7.3.0) (2026-06-12)


### Features

* :sparkles: add oauth endpoint for customGPT btree ([4377268](https://github.com/HannesOberreiter/btree_server/commit/4377268eeca10a58da5373ef9988dae50bd7f8df))
* wizbee model changed to Mistral Medium 3.5 ([2277be6](https://github.com/HannesOberreiter/btree_server/commit/2277be64566c2c50f7f2a83be4588477bcd5fecb))


### Performance

* **weather:** cache historical temperatures ([3319ff3](https://github.com/HannesOberreiter/btree_server/commit/3319ff3cf13b61fd7f8953325829254ad341fde6))


### Miscellaneous

* add tools to schema ([7f0668c](https://github.com/HannesOberreiter/btree_server/commit/7f0668c802b10af494b009991d6e2faddd3f1878))
* allow oauth with other origin ([e74e28f](https://github.com/HannesOberreiter/btree_server/commit/e74e28fef07e1054ad304f9013b23b071e018e79))
* call tool endpoint ([3946096](https://github.com/HannesOberreiter/btree_server/commit/39460965bfd387ed5a306ead089041f32dcb7076))
* change to custom chatgpt endpoint ([9153d79](https://github.com/HannesOberreiter/btree_server/commit/9153d79a0b7df9c1b7d1d9fd09e8a2fc5ba6c065))
* fix oauth tokens ([cee2def](https://github.com/HannesOberreiter/btree_server/commit/cee2def68c2b5c95db58284cd3a3d01be1744d1f))
* lint and internal fixes ([b35e722](https://github.com/HannesOberreiter/btree_server/commit/b35e722fffa757dd272b3c2261a34d4c77911713))
* make oauth allow list less strict ([cb2bda2](https://github.com/HannesOberreiter/btree_server/commit/cb2bda243700d7626c6e1b15a18b857c3e052404))
* migrate to pnpm, oxlint, oxfmt ([8de6127](https://github.com/HannesOberreiter/btree_server/commit/8de6127f3d5e4685afb56f0180d74a85a7d79d29))
* type checks and test fixes ([01f4265](https://github.com/HannesOberreiter/btree_server/commit/01f4265780b1c4465cad00ab3bbeba7eaca0d8e2))

## [7.2.0](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.1.1...btree-server-v7.2.0) (2026-05-07)


### Features

* :sparkles: add elevation endpoint for apiaries ([1036f2d](https://github.com/HannesOberreiter/btree_server/commit/1036f2d4b48369dd4b550a1a0afe276af622d50f))


### Bug Fixes

* :bug: improve fetching documentation and answering ([c6d4758](https://github.com/HannesOberreiter/btree_server/commit/c6d47587c982817f768dbf33683c276ee83788b9))
* :bug: limit coupon usage to 48h per company ([519ce54](https://github.com/HannesOberreiter/btree_server/commit/519ce54dbeb3d2c3caeb2b756e9ef6e4a17e11ef))

## [7.1.1](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.1.0...btree-server-v7.1.1) (2026-04-30)


### Bug Fixes

* :bug: fix invoice mail title ([dd2d123](https://github.com/HannesOberreiter/btree_server/commit/dd2d123a4109f27b49cb28ec16d39c4011ef909d))
* :sparkles: reduce tokens for wizbee by trimming system prompt ([6f4acf5](https://github.com/HannesOberreiter/btree_server/commit/6f4acf520af43e233aaadc6116c47a0f44685fa3))


### Miscellaneous

* :mute: remove debug logs ([ac4effa](https://github.com/HannesOberreiter/btree_server/commit/ac4effae8b8e3962d5baa2ea739930f5aec71b09))
* compress intrsuctions ([9a3888c](https://github.com/HannesOberreiter/btree_server/commit/9a3888c7703bf38c2755747dca4caf93255b3dc6))
* move agents file ([5e523b0](https://github.com/HannesOberreiter/btree_server/commit/5e523b01e814a923086c2c3d4347a0863bb25bf5))

## [7.1.0](https://github.com/HannesOberreiter/btree_server/compare/v7.0.0...v7.1.0) (2026-04-23)


### Features

* :sparkles: new endpoint for llms agents ([bae57c8](https://github.com/HannesOberreiter/btree_server/commit/bae57c89f53668553bb166c94a9ab59f083ea530))
* :sparkles: improve pest (velutina, aethina) fetching and add new endpoint for france ([663661d](https://github.com/HannesOberreiter/btree_server/commit/663661df8a9704f34788e9a309273cb98799db8d))
* :sparkles: use AGES AFB map for austria zones ([50c5e00](https://github.com/HannesOberreiter/btree_server/commit/50c5e00a825c97cf6fc65ccceaa3df1e3eb03c7a))
* :sparkles: allow voice transcription ([04d3910](https://github.com/HannesOberreiter/btree_server/commit/04d3910e8b45e9f015776bda4b4f8364b13b7839))
* :sparkles: automatically send invoice as PDF after payment is received from service ([1c1f738](https://github.com/HannesOberreiter/btree_server/commit/1c1f738b6d47ce8e4bce182db51aee9869311cdc))
* :sparkles: automatically create invoice for premium payment if requested by user ([240d8bc](https://github.com/HannesOberreiter/btree_server/commit/240d8bcf6330b664cae39b9ca192b64ff78ed7cc))


### Bug Fixes

* :bug: improve hanging teardown of logger ([015af6b](https://github.com/HannesOberreiter/btree_server/commit/015af6b26a098d00a9666939de92510e26c59b36))
* :bug: improve error logs serialize ([54c2dd3](https://github.com/HannesOberreiter/btree_server/commit/54c2dd36f91b965e5661387a3d8f803cb6699a32))
* :bug: apiary wizbee tool call wrong key for apiary filter on tasks ([395360e](https://github.com/HannesOberreiter/btree_server/commit/395360e913dc5401f9fde9a6e12dbbd69113c88c))
* :zap: wizbee improve error recovery on tool calls ([4646d69](https://github.com/HannesOberreiter/btree_server/commit/4646d6929fab2ec4029c5da42fc0afed039d357b))
* :bug: improve wizbee overflow and tool calling ([aef8feb](https://github.com/HannesOberreiter/btree_server/commit/aef8feb4b2a9160d180072ce2e0dec0ec1b6bb87))


### Miscellaneous

* :art: minor env changes ([c65c0ee](https://github.com/HannesOberreiter/btree_server/commit/c65c0eec46571999e458fd9554f84e8822a24941))
* types fix ([ea5907a](https://github.com/HannesOberreiter/btree_server/commit/ea5907a533e33db33a213081be3be331c35aa3b9))
* :mute: remove logs ([6714b28](https://github.com/HannesOberreiter/btree_server/commit/6714b28a0c70ccdd79a723f1930e8ba12bf2ce08))
* remove versioning in package json ([fabff16](https://github.com/HannesOberreiter/btree_server/commit/fabff16256444fb14bcdf903cf9f6f640590f075))
* Merge branch 'main' into beta ([d24953f](https://github.com/HannesOberreiter/btree_server/commit/d24953f))
* fix package lock ([5d082ab](https://github.com/HannesOberreiter/btree_server/commit/5d082ab2b08a81127ef6ffd733fd524a4ab82619))

## [7.0.0](https://github.com/HannesOberreiter/btree_server/compare/btree-server-v7.0.0...btree-server-v7.0.0) (2026-04-17)


### Features

* :sparkles: automated release notes ([#216](https://github.com/HannesOberreiter/btree_server/issues/216)) ([ab2a654](https://github.com/HannesOberreiter/btree_server/commit/ab2a654e0c6d125aece433f4d88f229dc85a2e3f))
