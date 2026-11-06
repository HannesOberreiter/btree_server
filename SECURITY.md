# Security Policy

## Report a vulnerability

Do not open a public issue for a vulnerability. Report it privately through GitHub: [Report a vulnerability](https://github.com/HannesOberreiter/btree/security/advisories/new).

Include:

- the affected URL, endpoint or file,
- the steps to reproduce the problem,
- the impact that you expect.

b.tree has one maintainer. Response times are best effort: we try to reply within 7 days. We tell you when the fix is live and credit you in the advisory, if you want. There is no bug bounty.

## Supported versions

Only the hosted service gets security fixes. We fix the current code on `beta` and release it to production. Self-hosted installations must update to the latest release.

## Scope

In scope:

- the web app: <https://app.btree.at> and <https://beta.btree.at>,
- the API: <https://api.btree.at> and <https://api-beta.btree.at>, including the MCP server and WizBee,
- the code and the GitHub workflows in this repository,
- the Docker image [`hannesoberreiter/btree_server`](https://hub.docker.com/r/hannesoberreiter/btree_server).

Out of scope:

- the public demo account. Its password is public on purpose.
- denial of service, load tests and rate limits,
- social engineering and physical attacks,
- reports from automated scanners without a demonstrated impact,
- missing security headers without a demonstrated impact,
- third-party services, for example payment providers and login providers.

## Rules for testing

- Use only accounts that you own.
- Do not read, change or delete data of other users. If you get access to such data by accident, stop and report it.
- Do not run load tests or automated scans against production. Use beta where possible.
