# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is in its initial state: it contains only a `README.md` and no source code, dependency manifest, build tooling, or tests yet. There are no commands to build, lint, or test because no project scaffolding exists.

## Intended purpose

Per `README.md`, this project is meant to be a mini AI agent written in Python, with planned capabilities for:
- Weather lookups
- Calculations
- Time queries

## Working in this repo

Since there is no established structure yet, when implementing the first version of this project:
- Confirm with the user what Python tooling/conventions they want (e.g., package manager, project layout, whether to use a framework for the agent/tool-calling logic) before introducing dependencies, since none are set up yet.
- Once code, dependencies, and tests exist, update this file with the real build/lint/test commands and the actual architecture (e.g., how the agent dispatches to the weather/calculation/time tools).
