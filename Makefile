# -*- coding: utf-8-unix -*-

check:
	flake8 *.py
	jshint *.js

run:
	python3 -m http.server

.PHONY: check run
