# -*- coding: utf-8-unix -*-

check:
	flake8 *.py

run:
	python3 -m http.server

.PHONY: check run
