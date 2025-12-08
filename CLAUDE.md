# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A MySQL query formatter written in Rust that compiles to WebAssembly. It takes SQL queries and returns opinionated formatted output with HTML syntax highlighting. The formatter uses a custom style (not MySQL Workbench style).

## Build Commands

```shell
# Run tests
cargo test

# Build for WebAssembly (browser usage)
wasm-pack build --target web

# Build release for Lambda (arm64)
cargo build --release --target aarch64-unknown-linux-gnu
```

## Architecture

The project has two main Rust files:

- **`src/lib.rs`**: Core formatting logic with the `mysqlFormat()` function exported via wasm-bindgen. Uses a state machine with Token types (Word, Name, Symbol, Number, String, Hex, Function, Variable, etc.) to parse and format SQL. Line wrapping at 80 chars with automatic breakpoints.

- **`build.rs`**: Build-time code generation using `phf_codegen` to create compile-time perfect hash sets for:
  - `KEYWORDS`: MySQL reserved words
  - `FUNCTIONS`: MySQL built-in functions
  - `ENCODINGS`: Character set/collation names

The formatter outputs HTML with inline styles for syntax highlighting (keywords blue, functions purple, strings teal, numbers red, etc.).

## Testing

Tests are in `src/lib.rs` under `#[cfg(test)]`. Run with `cargo test`. Test cases verify both helper functions (`is_word`, `is_function`, `is_encoding`) and the main `mysqlFormat` output.
