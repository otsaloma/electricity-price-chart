# -*- coding: utf-8-unix -*-

PYTHON = python3.12
VERSION = `date +%s`

check:
	flake8 *.py
	jshint *.js

clean:
	rm -rf html
	rm -rf lambda
	rm -f lambda.zip
	rm -f requirements-lambda.txt

# https://docs.aws.amazon.com/lambda/latest/dg/python-package.html
# https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html#runtimes-supported
# https://aws.amazon.com/premiumsupport/knowledge-center/lambda-python-package-compatible/
dist-lambda:
	$(MAKE) check clean
	cat requirements.txt \
	| grep -v boto3 \
	| grep -v flake8 \
	> requirements-lambda.txt
	pip3 install \
	--platform manylinux2014_x86_64 \
	--target lambda \
	--implementation cp \
	--python-version 3.12 \
	--only-binary=:all: \
	-r requirements-lambda.txt
	rm -rf lambda/bin
	rm -rf lambda/pyarrow
	find lambda -name "__pycache__" -prune -exec rm -rf {} \;
	find lambda -name "*.dist-info" -prune -exec rm -rf {} \;
	cp download.py lambda
	cd lambda && zip -r ../lambda.zip .

deploy-lambda:
	$(MAKE) dist-lambda
	test -f lambda.zip
	aws lambda update-function-code \
	--region eu-north-1 \
	--function-name entsoe-download \
	--zip-file fileb://lambda.zip

dist-html:
	$(MAKE) check clean
	mkdir html
	cp *.css *.html *.js *.png *.svg html
	sed -ri "s|\?v=dev\"|?v=$(VERSION)\"|g" html/*.html
	! grep "?v=dev" html/*.html
	./bundle-assets.py html/*.html
	rm html/*.css html/*.js

deploy-html:
	$(MAKE) dist-html
	@echo "Uploading HTML files..."
	aws s3 sync html/ s3://otsaloma.io/sahko/ \
	--exclude "*" \
	--include "*.html" \
	--acl public-read \
	--cache-control "public, max-age=3600"
	@echo "Uploading everything else..."
	aws s3 sync html/ s3://otsaloma.io/sahko/ \
	--exclude "*.html" \
	--acl public-read \
	--cache-control "public, max-age=86400"

run:
	python3 -m http.server

run-lambda:
	aws lambda invoke \
	--region eu-north-1 \
	--function-name entsoe-download \
	response.json
	cat response.json

venv:
	rm -rf venv
	$(PYTHON) -m venv venv
	. venv/bin/activate && \
	  pip install -U pip setuptools wheel && \
	  pip install -r requirements.txt

.PHONY: check clean dist-lambda deploy-lambda dist-html deploy-html run run-lambda venv
