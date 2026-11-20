#!/usr/bin/env python3
"""Build Farm English: same as python3 tools/series.py farm (see tools/series.py)."""
import os, runpy, sys
sys.argv = [sys.argv[0], "farm"] + sys.argv[1:]
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "series.py"), run_name="__main__")
