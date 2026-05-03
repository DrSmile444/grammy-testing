# grammy-testing — Claude Code instructions

## Quality gate

Run this sequence in order after every implementation session before marking work complete or
archiving a change. Fix every error before proceeding to the next step:

```
npm run lint:fix
npm run format:md
npm run typecheck
npm run lint
npm run test:run
npm run test:coverage
```

## Version bumps

Always bump **both** `package.json` and `jsr.json` to the same version string.

## Changelog

Add user-visible changes to `docs/CHANGELOG.md` under a new `## <version> — <date>` heading.
