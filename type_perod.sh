#!/bin/bash
# Simulates typing a period (.) followed by return/enter on macOS with 100ms delay
# Usage: ./type_period.sh

echo "tell application \"System Events\" to keystroke \".\"" | osascript
sleep 0.1
echo "tell application \"System Events\" to keystroke return" | osascript 