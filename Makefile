# -*- coding: utf-8-unix -*-

VERSION = `date +%Y%m%d%H%M`

check:
	flake8 *.py
	jshint *.js

clean:
	rm -rf html
	rm -rf lambda
	rm -f lambda.zip
	rm -f requirements-lambda.txt

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
	--python-version 3.9 \
	--only-binary=:all: \
	-r requirements-lambda.txt
	rm -rf lambda/bin
	find lambda -name "__pycache__" -prune -exec rm -rf {} \;
	find lambda -name "*.dist-info" -prune -exec rm -rf {} \;
	cp download.py lambda
	cd lambda && zip -r ../lambda.zip .

# https://docs.aws.amazon.com/lambda/latest/dg/python-package.html
# https://aws.amazon.com/premiumsupport/knowledge-center/lambda-python-package-compatible/
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
	$(if $(shell git status --porcelain),\
	  $(error "Uncommited changes!"))
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

.PHONY: check clean dist-lambda deploy-lambda dist-html deploy-html run
