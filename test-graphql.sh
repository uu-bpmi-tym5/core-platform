#!/bin/bash

# Test GraphQL Hello Query
echo "Testing Hello Query..."
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { hello }"}'

echo -e "\n\n"

# Test Login Mutation
echo "Testing Login Mutation..."
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(email: \"test@example.com\") }"}'

echo -e "\n"

