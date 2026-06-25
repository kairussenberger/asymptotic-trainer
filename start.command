#!/bin/bash
# Double-click to launch the Asymptotic Trainer in your default browser.
# Works no matter where this file is moved, as long as index.html sits next to it.
cd "$(dirname "$0")" || exit 1
open "index.html"
