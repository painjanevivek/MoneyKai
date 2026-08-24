# PR-1 dependency exceptions

**Recorded:** 2026-08-24

**Decision owner:** MoneyKai founder/account holder

**Review by:** 2026-09-24, or immediately when an upstream fix becomes available
**Scope:** Web build tooling and explicitly deferred mobile dependencies

## Expo/Metro `image-size` advisory

The npm audit currently reports one high-severity `image-size` advisory through the
Expo 56 Metro build chain. The four high-severity package rows (`image-size`, `metro`,
`metro-config`, and `metro-transform-worker`) describe the same transitive advisory,
not four independently reachable vulnerabilities.

### Reachability

- The package is a transitive Metro build dependency, not an application runtime import.
- It processes repository-controlled build assets during export.
- A clean production export contains no `image-size` library code. The only matching
  strings are Material Design icon names such as `image-size-select-actual`.
- `shell-quote` and `body-parser`, the other unresolved audit paths, are absent from the
  emitted web bundle and belong to the explicitly deferred mobile workspace.

### Patch and compatibility assessment

No patched `image-size` release is available on the installed Expo 56 dependency path.
The npm-generated remediation proposes changing the Expo/Metro toolchain outside the
official Expo 56 compatibility set. That is not a safe production fix. MoneyKai will
remain on the exact Expo 56-compatible patch set until Expo publishes a compatible
patched Metro chain.

### Compensating controls

- Builds run from a committed lockfile with `npm ci` in isolated CI workers.
- Pull requests must pass the dependency audit policy, static security baseline,
  production export, and existing test gates.
- Build inputs are repository-controlled; CI does not process user-supplied images.
- The package is not deployed as application runtime code.
- The audit policy fails on any new or expired critical/high exception.

### Removal condition

Upgrade the Expo 56-compatible Metro dependency chain as soon as Expo publishes a safe
patched path, then remove this exception after clean-install, export, test, and browser
smoke verification.

## Deferred mobile dependency advisories

Mobile implementation is explicitly outside the current production-readiness scope and
will be synchronized later. Existing mobile-only advisories remain visible and are not
dismissed. They do not block the web/backend gate because their dependency paths are not
present in the deployed web bundle. They must be re-triaged before any mobile release.

**Removal condition:** begin the mobile synchronization phase, upgrade the mobile
toolchain against its exact Expo version, and require a zero-reachable-critical/high
mobile release gate.
