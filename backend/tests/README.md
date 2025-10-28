# Backend Test Suite

Comprehensive test suite for the RHACbot backend API.

## Test Coverage

The test suite covers:

### Endpoints
- ✅ Health check (`/api/health`)
- ✅ Root endpoint (`/`)
- ✅ Buildings listing (`/api/buildings`)
- ✅ Authentication (`/api/auth`)
- ✅ Add chat (`/api/chats/add`)
- ✅ Send messages (`/api/messages/send`)

### Features
- ✅ CORS configuration
- ✅ Error handlers (404, 405, 500)
- ✅ Input validation
- ✅ Authentication/authorization
- ✅ Image upload
- ✅ Region-based targeting
- ✅ Helper functions
- ✅ API type classes

## Running Tests

### Prerequisites

Install test dependencies:

```bash
pip install -r requirements.txt
```

### Run All Tests

```bash
cd backend
python test_suite.py
```

### Run Specific Test Class

```bash
python -m unittest test_suite.TestHealthEndpoint
```

### Run With Verbose Output

```bash
python -m unittest -v test_suite
```

### Run With Coverage

Install coverage tool:

```bash
pip install coverage
```

Run tests with coverage:

```bash
coverage run -m unittest test_suite
coverage report
coverage html  # Generate HTML report
```

## Test Structure

### Test Classes

1. **TestHealthEndpoint** - Health check and root endpoint tests
2. **TestBuildingsEndpoint** - Building retrieval tests
3. **TestAuthEndpoint** - Authentication tests
4. **TestAddChatEndpoint** - Chat management tests
5. **TestSendMessageEndpoint** - Message sending tests
6. **TestHelperFunctions** - Utility function tests
7. **TestValidationFunctions** - Input validation tests
8. **TestCORSConfiguration** - CORS header tests
9. **TestErrorHandlers** - Error handling tests
10. **TestAPITypes** - Type class tests
11. **TestImageUpload** - Image upload tests
12. **TestRegionTargeting** - Region-based targeting tests

## Writing New Tests

### Example Test

```python
class TestNewFeature(unittest.TestCase):
    """Test new feature"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
    def test_feature_success(self):
        """Test successful feature execution"""
        response = self.client.get('/api/new-endpoint')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('expected_field', data)
```

### Mocking External Services

Use `@patch` decorator to mock external dependencies:

```python
@patch('app.external_api_call')
def test_with_mock(self, mock_api):
    """Test with mocked external API"""
    mock_api.return_value = {'success': True}
    
    # Your test code here
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.12'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd backend
        python test_suite.py
```

## Troubleshooting

### Import Errors

If you encounter import errors, ensure:
1. You're running from the `backend` directory
2. Python can find the `app.py` module
3. All dependencies are installed

### MongoDB Connection Errors

Tests use in-memory storage by default. If you see MongoDB errors:
- Check that `MONGODB_URI` is not set in test config
- Ensure `chats_collection` is properly mocked

### CORS Test Failures

CORS tests verify header presence. If failing:
1. Check CORS configuration in `app.py`
2. Verify allowed origins include test origin
3. Ensure CORS is initialized before routes

## Test Environment Variables

Tests automatically set safe defaults:

```python
self.app.config['TESTING'] = True
self.app.config['MONGODB_URI'] = None  # Use in-memory
self.app.config['ADMIN_PASSWORD'] = 'test_password'
self.app.config['GROUPME_ACCESS_TOKEN'] = 'test_token'
```

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain test coverage above 80%
4. Document new test cases
5. Update this README if needed

## Resources

- [unittest documentation](https://docs.python.org/3/library/unittest.html)
- [unittest.mock documentation](https://docs.python.org/3/library/unittest.mock.html)
- [Flask testing documentation](https://flask.palletsprojects.com/en/latest/testing/)
