#!/bin/bash
# TrueBank Digital SME — full deploy script
# Usage: ./deploy.sh
#
# Reads the Anthropic API key from SSM Parameter Store so it never needs
# to be passed on the command line or committed to the repo.

set -e

STACK_NAME="truebank-sme"
REGION="us-east-1"
SAM_BUCKET="aws-sam-cli-managed-default-samclisourcebucket-vcpjekvluerb"
FRONTEND_BUCKET="truebank-sme-frontend-512492730598"
CF_DISTRIBUTION="E30ZAAN6F1IU1O"
SSM_KEY_PATH="/truebank-sme/anthropic-api-key"

echo "→ Fetching API key from SSM..."
API_KEY=$(aws ssm get-parameter \
  --name "$SSM_KEY_PATH" \
  --with-decryption \
  --region "$REGION" \
  --query "Parameter.Value" \
  --output text)

echo "→ Building Lambda bundle..."
npx esbuild server/lambda.js \
  --bundle --platform=node --target=node20 --format=cjs \
  --external:@aws-sdk \
  --outfile=.lambda-build/lambda.js

echo "→ Building React frontend..."
npm run build

echo "→ Running SAM build..."
sam build

echo "→ Deploying SAM stack..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --s3-bucket "$SAM_BUCKET" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides "AnthropicApiKey=$API_KEY" \
  --force-upload \
  --no-confirm-changeset

echo "→ Syncing frontend to S3..."
aws s3 sync dist/ "s3://$FRONTEND_BUCKET" --delete --region "$REGION"

echo "→ Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION" \
  --paths "/*" \
  --query "Invalidation.Id" --output text

echo "✓ Deploy complete — https://d2c2qvpuv466x2.cloudfront.net"
