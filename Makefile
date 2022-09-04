# -*- coding: utf-8-unix -*-

check:
	flake8 *.py
	jshint *.js

clean:
	rm -rf lambda
	rm -f lambda.zip
	rm -f requirements-lambda.txt

# https://docs.aws.amazon.com/lambda/latest/dg/python-package.html
# https://aws.amazon.com/premiumsupport/knowledge-center/lambda-python-package-compatible/
deploy-lambda:
	$(MAKE) clean
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
	test -f lambda.zip
	aws lambda update-function-code \
	--region eu-north-1 \
	--function-name entsoe-download \
	--zip-file fileb://lambda.zip

run:
	python3 -m http.server

.PHONY: check clean deploy-lambda run
