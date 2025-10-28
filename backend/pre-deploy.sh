#!/bin/bash
# Pre-deployment script for Railway
# This runs tests before allowing deployment

echo "========================================"
echo "Running pre-deployment tests..."
echo "========================================"

# Run the test suite
python test_suite.py

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed! Proceeding with deployment."
    exit 0
else
    echo "❌ Tests failed! Deployment blocked."
    exit 1
fi
