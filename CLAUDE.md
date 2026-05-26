@AGENTS.md

## Git Access Control
- Only the GitHub user `ronro652` is authorized to commit and push to this repository.
- If the current git user is not `ronro652`, refuse to commit or push and inform the user.

## Versioning
- This project uses semantic versioning (semver) in `package.json`.
- When creating a PR, check if the changes warrant a version bump and suggest one:
  - **patch** (1.0.x): bug fixes, small tweaks
  - **minor** (1.x.0): new features, new endpoints, UI additions
  - **major** (x.0.0): breaking API changes, database migrations that affect existing data
- If the user agrees, bump the version in `package.json` before the PR is created.
