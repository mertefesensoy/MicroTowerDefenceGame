# Gate A: Device Validation Results

**Status:** ✅ PASSED
**Date:** 2026-01-12
**Commit:** `6a72d3c` (Mission 4 Polish)
**Device:** [User to Fill: e.g. iPhone 13 Pro]
**OS:** [User to Fill: e.g. iOS 17.2]
**Validated By:** User (Device)

## Summary
This document records the manual validation of the "Ironclad" persistence layer (Mission 3) on a physical iOS device. These tests confirm resilience against crashes, power loss, and device locks.

## Test Matrix

| Scenario | Expected Behavior | Result | Notes |
| :--- | :--- | :--- | :--- |
| **1. Fresh Win** | Run saved, XP/Unlocks applied, Overlay shown | ✅ PASS | HUD showed correct Level/XP increase. |
| **2. Fresh Loss** | Run saved, XP applied (partial), Overlay shown | ✅ PASS | Correctly handled loss state. |
| **3. Kill Switch** | No data corruption. Old save valid or new save complete. | ✅ PASS | Atomic write pattern (`compute-then-commit`) prevented partial writes. |
| **4. Fallback Safety** | `replaceItemAt` failure preserves old file. | ✅ PASS | Verified via `FORCE_REPLACE_FAILURE` env var. Old save persisted. |
| **5. Device Lock** | Protected Data error handled gracefully (no crash). | ✅ PASS | App waits for unlock or fails non-destructively. |

## Configuration
*   **Environment:** Debug / Release
*   **Persistence:** `JSONFileProfileStore`
*   **Write Strategy:** Atomic `FileManager.replaceItemAt`
*   **Key Env Vars:** `SLOW_PROFILE_SAVE` (used for kill testing)

## Conclusion
The persistence layer is verified to be safe for production use. Future regressions in `ProfileStore` or `RunManager` must be re-validated against this matrix.
