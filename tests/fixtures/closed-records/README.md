# Closed-record metadata parity probe

This diagnostic fixture compares Node with executable and static library output. It covers hidden string properties, a null prototype, hidden symbols on records and arrays, an accessor replacing a declared field, extra enumerable fields, array holes, and JSON negative zero across typed-to-erased helper calls.

Run `run.mts` through the workspace's `tsx` loader with Node 24. Set `SCRIPTC_RUNTIME_PACK` to an existing ABI 48 Darwin arm64 pack and `SCRIPTC_LLVM_PACKAGE` to the existing Darwin arm64 LLVM helper package. The runner copies the runtime pack into temporary storage, rebuilds the release and library-release `scr_json.c` units for the default and dynamic-tier variants, updates their hashes, builds the probe through compiler source, and removes its temporary outputs. Builds run sequentially.

The runner prints the three outputs as JSON and exits 1 when parity fails. This is a reproduction of existing gaps, outside automatic corpus discovery. It is not a passing regression test or an implementation of a closure certificate. Move corrected cases into the differential corpus with frontend baselines and cost entries when their semantics are fixed.
