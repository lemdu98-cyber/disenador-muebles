# FurnitureModel

## Purpose and authority

`FurnitureModel` is a read-only structural projection used for inspection, semantic selection, diagnostics, canonical front regions, and controlled editing. Existing parametric configs, structure calculators, piece generators, and manufacturing flows remain authoritative. `FurnitureModel` is not the manufacturing source of truth.

The read flow is:

```text
authoritative config
→ existing structure calculators and generators
→ FurnitureModel components
→ relations
→ diagnostics
→ canonical regions
→ DEV Inspector and overlays
```

`modelVersion` is currently `1`. It versions the in-memory projection contract and is independent of the persisted Supabase `schema_version`.

## Structural contract

A model contains deterministic semantic components with stable IDs, hierarchy, dimensions, positions, bounds, orientations, and links to generated pieces through `sourcePieceIds`. Logical components describe meaningful assemblies such as a wardrobe body, drawer, opening, or Desk drawer module. Physical components resolve to existing generated pieces; the model never manufactures replacements for them.

Relations describe explicit structural facts such as containment, support, connection, separation, and front coverage. Diagnostics validate those declared facts without acting as a solver. Regions are canonical planar descriptions of openings and fronts; DEV overlays render those regions without changing model geometry.

Selection is bidirectional: selecting a semantic or physical component in the Inspector highlights its rendered descendants, while supported 3D hits select the corresponding semantic ID in the Inspector.

## Controlled editing

Only properties already backed by an authoritative parametric config are exposed:

| Furniture | Semantic component | Controlled property |
| --- | --- | --- |
| Wardrobe | `wardrobe.body.1...3` | body `widthRatio` |
| TV Stand | `tvStand.section.1...2` | section `widthRatio` |
| Nightstand | `nightstand.drawer.1...4` | drawer `heightRatio` |
| Desk | `desk.drawerModule` | `moduleSide`, `moduleWidthRatio` |
| Cat House | none | none |

`getEditableProperties()` is the capability boundary. Physical drawer pieces, dividers, openings, positions, raw dimensions, meshes, and generated pieces are not directly editable.

The edit flow is:

```text
DEV Inspector
→ semantic edit intent
→ applyFurnitureModelEdit()
→ candidate authoritative config
→ existing structure validation
→ App commits the authoritative config
→ existing generators rebuild pieces and FurnitureModel
```

The stable edit property names are `widthRatio`, `heightRatio`, `moduleSide`, and `moduleWidthRatio`.

## Transactions

`applyFurnitureModelTransaction({ furnitureType, model, config, edits, context })` evaluates an ordered list of edit intents for the active furniture type. `furnitureType` is optional and defaults to `model.furnitureType`; when supplied, it must match.

Each edit is passed sequentially to `applyFurnitureModelEdit()` using an immutable candidate config. Edit order is significant and is preserved in `appliedEdits`.

A successful result is:

```js
{
  ok: true,
  furnitureType,
  nextConfig,
  diff: [{ path, before, after }],
  appliedEdits
}
```

Diff entries use concrete leaf paths such as `sectionWidthRatios[0]` or `drawerModuleSide` and are sorted by path. Unchanged fields are omitted.

A failed result is:

```js
{
  ok: false,
  error: {
    code: "TRANSACTION_FAILED",
    message,
    cause: { code, message }
  },
  failedEditIndex,
  edit
}
```

Failure returns no `nextConfig`. Because App state is not changed during evaluation, rollback means discarding the failed candidate. On success, App performs exactly one authoritative config update.

The DEV Inspector keeps pending edits locally, previews the resulting config diff, and provides one **Apply transaction** and one **Cancel pending changes** action. Preview and cancel never change App state and do not render speculative geometry.

## Public API

The `src/utils/furnitureModel/index.js` barrel is the public entry point. Its principal API groups are:

- model construction and validation;
- component, spatial, selection, and source-piece inspection;
- relation construction, lookup, and validation;
- diagnostic construction, summaries, and validation;
- canonical region construction, lookup, and validation;
- `getEditableProperties()`;
- `applyFurnitureModelEdit()` for backwards-compatible single edits;
- `applyFurnitureModelTransaction()` for atomic ordered edits.

Transaction diff implementation details remain private to `editTransaction.js`.

## Deliberate non-goals

The subsystem is not an authoritative generic renderer, generic manufacturing engine, freeform editor, constraint solver, auto-fix system, hardware graph, or generic joinery representation. It does not provide 3D drag, direct XYZ editing, semantic creation/deletion, drawer-count editing, or Cat House editing.

The Inspector, semantic editor, diagnostic views, and region overlays remain DEV-only tools. Persistence continues through the existing furniture configs; this subsystem introduces no Supabase schema changes.
