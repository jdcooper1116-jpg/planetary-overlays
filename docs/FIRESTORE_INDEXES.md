# Firestore Indexes - Four Pillars

## Purpose

This document tracks the Firestore composite indexes used by the Four Pillars research layer.

## Current pilot scope

- NY Pick 3 January 2024
- NY Pick 4 January 2024 controlled pilot

## Files

- `firestore.indexes.json`
- `firebase.json`

## Deploy command

```bash
firebase deploy --only firestore:indexes
```

## Notes

Do not deploy indexes until the Firebase project and CLI target are confirmed.

If Firebase returns a missing-index error, use the generated console link to create the exact index, then mirror it into `firestore.indexes.json`.


## Phase 6F reconciliation

Live Firestore indexes were exported from the four-pillars-lottery-system project using npx firebase-tools firestore:indexes and mirrored into firestore.indexes.json so future index deploys do not prompt to delete existing project indexes.
