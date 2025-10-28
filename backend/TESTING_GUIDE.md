# Quick Test Reference

## Running Tests

### Quick Start
```bash
cd backend
python test_suite.py
```

### Common Commands
```bash
# Run all tests
python run_tests.py

# Verbose output
python run_tests.py -v

# With coverage
python run_tests.py -c

# Specific test class
python -m unittest test_suite.TestHealthEndpoint

# Single test method
python -m unittest test_suite.TestHealthEndpoint.test_health_check_success
```

## Test Classes Quick Reference

| Test Class | What It Tests | Key Tests |
|------------|--------------|-----------|
| `TestHealthEndpoint` | Health check & root | `test_health_check_success` |
| `TestBuildingsEndpoint` | Building retrieval | `test_get_buildings_success` |
| `TestAuthEndpoint` | Authentication | `test_auth_success`, `test_auth_failure_wrong_password` |
| `TestAddChatEndpoint` | Chat management | `test_add_chat_success`, `test_add_chat_invalid_link` |
| `TestSendMessageEndpoint` | Message sending | `test_send_message_success`, `test_send_message_unauthorized` |
| `TestHelperFunctions` | Utility functions | `test_extract_group_id_valid_link` |
| `TestValidationFunctions` | Input validation | `test_validate_message_body_valid` |
| `TestCORSConfiguration` | CORS headers | `test_cors_headers_present` |
| `TestErrorHandlers` | Error handling | `test_404_handler`, `test_405_handler` |
| `TestAPITypes` | Type classes | `test_add_chat_request_valid` |
| `TestImageUpload` | Image uploads | `test_send_message_with_image` |
| `TestRegionTargeting` | Region targeting | `test_send_message_by_region` |

## Writing a New Test

```python
def test_my_feature(self):
    """Test description"""
    # 1. Setup
    data = {'key': 'value'}
    
    # 2. Execute
    response = self.client.post('/api/endpoint', json=data)
    
    # 3. Assert
    self.assertEqual(response.status_code, 200)
    result = json.loads(response.data)
    self.assertEqual(result['expected'], 'value')
```

## Common Assertions

```python
# Status codes
self.assertEqual(response.status_code, 200)

# JSON content
data = json.loads(response.data)
self.assertIn('key', data)
self.assertEqual(data['key'], 'value')

# Headers
self.assertIn('Content-Type', response.headers)

# True/False
self.assertTrue(condition)
self.assertFalse(condition)

# None checks
self.assertIsNone(value)
self.assertIsNotNone(value)
```

## Mocking Examples

### Mock function
```python
@patch('app.function_name')
def test_something(self, mock_func):
    mock_func.return_value = 'test_value'
    # Test code here
```

### Mock multiple functions
```python
@patch('app.function2')
@patch('app.function1')
def test_something(self, mock_func1, mock_func2):
    # Note: decorators are applied bottom-up
    # so mock_func1 comes first in parameters
    pass
```

### Mock module variable
```python
@patch('app.buildings_data', [{'id': 1, 'name': 'Test'}])
def test_something(self):
    # buildings_data is now mocked
    pass
```

## Debugging Tests

### Print during test
```python
def test_something(self):
    response = self.client.get('/api/endpoint')
    print(f"Response: {response.data}")  # Will show in output
    self.assertEqual(response.status_code, 200)
```

### Run with debug
```bash
python -m unittest -v test_suite.TestClassName 2>&1 | more
```

### Check specific failure
```bash
python -m unittest test_suite.TestClassName.test_specific_test
```

## Coverage Commands

```bash
# Run with coverage
coverage run -m unittest test_suite

# Show report
coverage report

# Show missing lines
coverage report -m

# Generate HTML
coverage html
# Open: htmlcov/index.html

# Focus on specific file
coverage report app.py
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run tests
  run: |
    cd backend
    python run_tests.py -v
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
cd backend
python run_tests.py
if [ $? -ne 0 ]; then
    echo "Tests failed! Commit aborted."
    exit 1
fi
```

## Troubleshooting

### Import errors
```bash
# Ensure you're in the backend directory
cd backend
python test_suite.py
```

### Module not found
```bash
# Install dependencies
pip install -r requirements.txt
```

### Database connection errors
Tests use in-memory storage by default, so no MongoDB needed.

### Test discovery issues
```bash
# Use explicit module path
python -m unittest discover -s . -p "test*.py"
```

## Test Output Interpretation

```
test_health_check_success (__main__.TestHealthEndpoint) ... ok
```
- `test_health_check_success` - Test method name
- `TestHealthEndpoint` - Test class name
- `ok` - Test passed ✅

```
test_auth_failure ... FAIL
```
- `FAIL` - Test failed ❌ (assertion failed)

```
test_something ... ERROR
```
- `ERROR` - Test error ⚠️ (exception raised)

```
test_skip ... skipped 'reason'
```
- `skipped` - Test skipped ⏭️

## Quick Fixes

### Test fails locally but works in CI
- Check environment variables
- Check file paths (absolute vs relative)
- Check Python version

### All tests fail with import errors
```bash
# Add backend to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"
python backend/test_suite.py
```

### Mock not working
- Check decorator order (bottom-up)
- Verify module path in patch
- Ensure mock is called before test code

## Best Practices

1. ✅ One assertion per test (when possible)
2. ✅ Descriptive test names
3. ✅ Clear test structure (Setup → Execute → Assert)
4. ✅ Mock external dependencies
5. ✅ Test edge cases and error conditions
6. ✅ Keep tests independent
7. ✅ Clean up after tests
8. ✅ Use setUp() for common initialization
