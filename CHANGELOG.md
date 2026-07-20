# Changelog

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
