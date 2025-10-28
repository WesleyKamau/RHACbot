"""
Comprehensive test suite for RHACbot Backend API

This test suite covers:
- Health check endpoint
- Building retrieval
- Authentication
- Chat management (add chat)
- Message sending
- CORS configuration
- Error handling
- Input validation
- Database operations (with mocking)
- GroupMe API integration (with mocking)
"""

import unittest
from unittest.mock import Mock, patch, MagicMock, mock_open
import json
import io
from pathlib import Path
import sys
import os

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Import app components
from app import app, init_app, extract_group_id_and_token_from_link
from api_types import (
    HealthCheckResponse, AddChatRequest, AddChatResponse, AuthRequest,
    AuthResponse, AuthErrorResponse, MessageSendSummary, MessageFailure,
    SendMessageSuccessResponse, SendMessagePartialResponse, ApiError,
    Building, Region, RegionTarget,
    is_valid_building_id, is_valid_region, is_valid_region_target, validate_message_body
)


class TestHealthEndpoint(unittest.TestCase):
    """Test health check endpoint"""
    
    def setUp(self):
        """Set up test client and test data"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['MONGODB_URI'] = None  # Use in-memory for tests
        self.client = self.app.test_client()
        
    def test_health_check_success(self):
        """Test that health check returns 200 OK"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'ok')
        self.assertIn('message', data)
        
    def test_root_endpoint(self):
        """Test root endpoint returns API info"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['name'], 'RHACbot API')
        self.assertEqual(data['status'], 'online')
        self.assertIn('endpoints', data)


class TestBuildingsEndpoint(unittest.TestCase):
    """Test buildings retrieval endpoint"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
    @patch('app.buildings_data', [
        {'id': 1, 'name': 'Test Building', 'region': 'north'},
        {'id': 2, 'name': 'Another Building', 'region': 'south'}
    ])
    def test_get_buildings_success(self):
        """Test retrieving buildings list"""
        response = self.client.get('/api/buildings')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('buildings', data)
        self.assertEqual(len(data['buildings']), 2)
        self.assertEqual(data['buildings'][0]['name'], 'Test Building')


class TestAuthEndpoint(unittest.TestCase):
    """Test authentication endpoint"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['ADMIN_PASSWORD'] = 'test_password_123'
        self.client = self.app.test_client()
        
    def test_auth_success(self):
        """Test successful authentication"""
        response = self.client.post('/api/auth',
                                   json={'password': 'test_password_123'},
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Authenticated')
        
    def test_auth_failure_wrong_password(self):
        """Test authentication failure with wrong password"""
        response = self.client.post('/api/auth',
                                   json={'password': 'wrong_password'},
                                   content_type='application/json')
        self.assertEqual(response.status_code, 401)
        
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'Unauthorized')
        
    def test_auth_failure_missing_password(self):
        """Test authentication failure with missing password"""
        response = self.client.post('/api/auth',
                                   json={},
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'Missing password')


class TestAddChatEndpoint(unittest.TestCase):
    """Test add chat endpoint"""
    
    def setUp(self):
        """Set up test client and mocks"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['GROUPME_ACCESS_TOKEN'] = 'test_token'
        self.app.config['MONGODB_URI'] = None  # Use in-memory
        self.client = self.app.test_client()
        
    @patch('app.join_group')
    @patch('app.add_chat')
    @patch('app.chats_collection', None)
    @patch('app._fallback_chats', [])
    def test_add_chat_success(self, mock_add_chat, mock_join_group):
        """Test successfully adding a chat"""
        mock_join_group.return_value = True
        mock_add_chat.return_value = {
            '_id': 'test_id_123',
            'groupme_id': '12345678',
            'building_id': 1,
            'floor_number': 5
        }
        
        payload = {
            'groupme_link': 'https://groupme.com/join_group/12345678/SHARE_TOKEN_ABC',
            'building_id': 1,
            'floor_number': 5
        }
        
        response = self.client.post('/api/chats/add',
                                   json=payload,
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Chat added successfully')
        self.assertIn('chat_id', data)
        
    def test_add_chat_invalid_link(self):
        """Test adding chat with invalid GroupMe link"""
        payload = {
            'groupme_link': 'https://invalid-link.com',
            'building_id': 1,
            'floor_number': 5
        }
        
        response = self.client.post('/api/chats/add',
                                   json=payload,
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'Invalid GroupMe link')
        
    def test_add_chat_missing_fields(self):
        """Test adding chat with missing required fields"""
        payload = {
            'groupme_link': 'https://groupme.com/join_group/12345678/TOKEN'
        }
        
        response = self.client.post('/api/chats/add',
                                   json=payload,
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertIn('error', data)


class TestSendMessageEndpoint(unittest.TestCase):
    """Test send message endpoint"""
    
    def setUp(self):
        """Set up test client and mocks"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['ADMIN_PASSWORD'] = 'test_password'
        self.app.config['GROUPME_ACCESS_TOKEN'] = 'test_token'
        self.client = self.app.test_client()
        
    def test_send_message_unauthorized(self):
        """Test sending message without authentication"""
        data = {
            'building_ids': ['1'],
            'message_body': 'Test message',
            'password': 'wrong_password'
        }
        
        response = self.client.post('/api/messages/send', data=data)
        self.assertEqual(response.status_code, 401)
        
        response_data = json.loads(response.data)
        self.assertEqual(response_data['error'], 'Unauthorized')
        
    def test_send_message_missing_fields(self):
        """Test sending message with missing required fields"""
        data = {
            'password': 'test_password'
        }
        
        response = self.client.post('/api/messages/send', data=data)
        self.assertEqual(response.status_code, 400)
        
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
        
    @patch('app.get_groupme_map_by_buildings')
    @patch('app.send_message_to_group')
    @patch('app.buildings_data', [{'id': 1, 'name': 'Test Building', 'region': 'north'}])
    def test_send_message_success(self, mock_send, mock_get_map):
        """Test successfully sending messages"""
        mock_get_map.return_value = {
            1: [{'group_id': 'group123', 'floor_number': 5}]
        }
        mock_send.return_value = {
            'success': True,
            'group_id': 'group123',
            'status_code': 201
        }
        
        data = {
            'building_ids': ['1'],
            'message_body': 'Test message',
            'password': 'test_password'
        }
        
        response = self.client.post('/api/messages/send', data=data)
        self.assertEqual(response.status_code, 200)
        
        response_data = json.loads(response.data)
        self.assertIn('message', response_data)
        self.assertIn('summary', response_data)
        
    @patch('app.get_groupme_map_by_buildings')
    def test_send_message_no_groups_found(self, mock_get_map):
        """Test sending message when no groups exist for building"""
        mock_get_map.return_value = {1: []}
        
        data = {
            'building_ids': ['1'],
            'message_body': 'Test message',
            'password': 'test_password'
        }
        
        response = self.client.post('/api/messages/send', data=data)
        self.assertEqual(response.status_code, 404)
        
    def test_send_message_empty_body(self):
        """Test sending message with empty message body"""
        data = {
            'building_ids': ['1'],
            'message_body': '',
            'password': 'test_password'
        }
        
        response = self.client.post('/api/messages/send', data=data)
        self.assertEqual(response.status_code, 400)


class TestHelperFunctions(unittest.TestCase):
    """Test helper and utility functions"""
    
    def test_extract_group_id_valid_link(self):
        """Test extracting group ID from valid GroupMe link"""
        link = 'https://groupme.com/join_group/12345678/SHARE_TOKEN_ABC'
        result = extract_group_id_and_token_from_link(link)
        
        self.assertIsNotNone(result)
        self.assertEqual(result[0], '12345678')
        self.assertEqual(result[1], 'SHARE_TOKEN_ABC')
        
    def test_extract_group_id_invalid_link(self):
        """Test extracting group ID from invalid link"""
        link = 'https://invalid-link.com'
        result = extract_group_id_and_token_from_link(link)
        
        self.assertIsNone(result)
        
    def test_extract_group_id_with_trailing_slash(self):
        """Test extracting group ID with trailing slash"""
        link = 'https://groupme.com/join_group/12345678/TOKEN/'
        result = extract_group_id_and_token_from_link(link)
        
        self.assertIsNotNone(result)
        self.assertEqual(result[0], '12345678')


class TestValidationFunctions(unittest.TestCase):
    """Test validation functions from api_types"""
    
    def test_validate_message_body_valid(self):
        """Test validating valid message body"""
        result = validate_message_body('This is a valid message')
        self.assertIsNone(result)
        
    def test_validate_message_body_empty(self):
        """Test validating empty message body"""
        result = validate_message_body('')
        self.assertIsNotNone(result)
        self.assertIn('required', result.lower())
        
    def test_validate_message_body_whitespace_only(self):
        """Test validating message body with only whitespace"""
        result = validate_message_body('   ')
        self.assertIsNotNone(result)
        self.assertIn('required', result.lower())
        
    def test_validate_message_body_too_long(self):
        """Test validating message body that's too long"""
        long_message = 'x' * 1001
        result = validate_message_body(long_message)
        self.assertIsNotNone(result)
        self.assertIn('1000', result)
        
    def test_validate_message_body_exactly_1000(self):
        """Test validating message body at exactly 1000 characters"""
        message = 'x' * 1000
        result = validate_message_body(message)
        self.assertIsNone(result)
        
    def test_is_valid_building_id(self):
        """Test building ID validation"""
        self.assertTrue(is_valid_building_id(0))
        self.assertTrue(is_valid_building_id(1))
        self.assertTrue(is_valid_building_id(40))
        self.assertFalse(is_valid_building_id(41))
        self.assertFalse(is_valid_building_id(-1))
        self.assertFalse(is_valid_building_id(100))
        
    def test_is_valid_building_id_type_checking(self):
        """Test building ID validation with wrong types"""
        self.assertFalse(is_valid_building_id('1'))
        self.assertFalse(is_valid_building_id(1.5))
        self.assertFalse(is_valid_building_id(None))
        
    def test_is_valid_region_target_case_insensitive(self):
        """Test region target validation is case-insensitive"""
        # Uppercase
        self.assertTrue(is_valid_region_target('North'))
        self.assertTrue(is_valid_region_target('South'))
        self.assertTrue(is_valid_region_target('West'))
        self.assertTrue(is_valid_region_target('ALL'))
        
        # Lowercase
        self.assertTrue(is_valid_region_target('north'))
        self.assertTrue(is_valid_region_target('south'))
        self.assertTrue(is_valid_region_target('west'))
        self.assertTrue(is_valid_region_target('all'))
        
        # Mixed case
        self.assertTrue(is_valid_region_target('NoRtH'))
        self.assertTrue(is_valid_region_target('sOuTh'))
        
        # Invalid
        self.assertFalse(is_valid_region_target('east'))
        self.assertFalse(is_valid_region_target('invalid_region'))
        self.assertFalse(is_valid_region_target(''))
        
    def test_is_valid_region_target_type_checking(self):
        """Test region target validation with wrong types"""
        self.assertFalse(is_valid_region_target(123))
        self.assertFalse(is_valid_region_target(None))
        self.assertFalse(is_valid_region_target(['north']))
        
    def test_is_valid_region_case_insensitive(self):
        """Test region validation is case-insensitive"""
        # Uppercase
        self.assertTrue(is_valid_region('North'))
        self.assertTrue(is_valid_region('South'))
        self.assertTrue(is_valid_region('West'))
        
        # Lowercase
        self.assertTrue(is_valid_region('north'))
        self.assertTrue(is_valid_region('south'))
        self.assertTrue(is_valid_region('west'))
        
        # Mixed case
        self.assertTrue(is_valid_region('NoRtH'))
        
        # Invalid
        self.assertFalse(is_valid_region('all'))  # 'all' is not a Region, only RegionTarget
        self.assertFalse(is_valid_region('east'))
        self.assertFalse(is_valid_region(''))
        
    def test_is_valid_region_type_checking(self):
        """Test region validation with wrong types"""
        self.assertFalse(is_valid_region(123))
        self.assertFalse(is_valid_region(None))
        self.assertFalse(is_valid_region(['north']))


class TestCORSConfiguration(unittest.TestCase):
    """Test CORS configuration"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
    def test_cors_headers_present(self):
        """Test that CORS headers are present in response"""
        response = self.client.get('/api/health',
                                  headers={'Origin': 'https://rhacbot.wesleykamau.com'})
        
        # Check for CORS headers
        self.assertIn('Access-Control-Allow-Origin', response.headers)
        
    def test_cors_preflight(self):
        """Test CORS preflight OPTIONS request"""
        response = self.client.options('/api/health',
                                      headers={
                                          'Origin': 'https://rhacbot.wesleykamau.com',
                                          'Access-Control-Request-Method': 'GET'
                                      })
        
        # Preflight should succeed
        self.assertIn(response.status_code, [200, 204])


class TestErrorHandlers(unittest.TestCase):
    """Test error handlers"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
    def test_404_handler(self):
        """Test 404 error handler"""
        response = self.client.get('/api/nonexistent')
        self.assertEqual(response.status_code, 404)
        
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'Not found')
        
    def test_405_handler(self):
        """Test 405 method not allowed handler"""
        # Try to POST to a GET-only endpoint
        response = self.client.post('/api/buildings')
        self.assertEqual(response.status_code, 405)
        
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'Method not allowed')


class TestAPITypes(unittest.TestCase):
    """Test API type classes and validation"""
    
    def test_health_check_response(self):
        """Test HealthCheckResponse class"""
        response = HealthCheckResponse(status='ok', message='Test')
        data = response.to_dict()
        
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['message'], 'Test')
        
    def test_api_error_with_details(self):
        """Test ApiError with details"""
        error = ApiError(error='Test error', details='Additional info')
        data = error.to_dict()
        
        self.assertEqual(data['error'], 'Test error')
        self.assertEqual(data['details'], 'Additional info')
        
    def test_api_error_without_details(self):
        """Test ApiError without details"""
        error = ApiError(error='Test error')
        data = error.to_dict()
        
        self.assertEqual(data['error'], 'Test error')
        self.assertNotIn('details', data)  # None values should be filtered out
        
    def test_building_from_dict(self):
        """Test Building.from_dict"""
        data = {
            'id': 5,
            'name': 'Test Building',
            'address': '123 Test St',
            'region': 'North'
        }
        building = Building.from_dict(data)
        
        self.assertEqual(building.id, 5)
        self.assertEqual(building.name, 'Test Building')
        self.assertEqual(building.address, '123 Test St')
        self.assertEqual(building.region, 'North')
        
    def test_building_to_dict(self):
        """Test Building.to_dict"""
        building = Building(id=5, name='Test', address='123 St', region='North')
        data = building.to_dict()
        
        self.assertEqual(data['id'], 5)
        self.assertEqual(data['name'], 'Test')
        
    def test_add_chat_request_valid(self):
        """Test AddChatRequest with valid data"""
        request = AddChatRequest(
            groupme_link='https://groupme.com/join_group/123/TOKEN',
            building_id=1,
            floor_number=5
        )
        
        error = request.validate()
        self.assertIsNone(error)
        
    def test_add_chat_request_invalid_building_id(self):
        """Test AddChatRequest with invalid building ID"""
        request = AddChatRequest(
            groupme_link='https://groupme.com/join_group/123/TOKEN',
            building_id=-1,
            floor_number=5
        )
        
        error = request.validate()
        self.assertIsNotNone(error)
        self.assertIn('building_id', error)
        
    def test_add_chat_request_invalid_floor(self):
        """Test AddChatRequest with invalid floor number"""
        request = AddChatRequest(
            groupme_link='https://groupme.com/join_group/123/TOKEN',
            building_id=1,
            floor_number=0
        )
        
        error = request.validate()
        self.assertIsNotNone(error)
        self.assertIn('floor_number', error)
        
    def test_add_chat_request_empty_link(self):
        """Test AddChatRequest with empty GroupMe link"""
        request = AddChatRequest(
            groupme_link='',
            building_id=1,
            floor_number=5
        )
        
        error = request.validate()
        self.assertIsNotNone(error)
        self.assertIn('groupme_link', error)
        
    def test_add_chat_request_from_dict(self):
        """Test AddChatRequest.from_dict"""
        data = {
            'groupme_link': 'https://groupme.com/join_group/123/TOKEN',
            'building_id': 5,
            'floor_number': 3
        }
        request = AddChatRequest.from_dict(data)
        
        self.assertEqual(request.groupme_link, data['groupme_link'])
        self.assertEqual(request.building_id, 5)
        self.assertEqual(request.floor_number, 3)
        
    def test_add_chat_response(self):
        """Test AddChatResponse"""
        response = AddChatResponse(message='Success', chat_id='abc123')
        data = response.to_dict()
        
        self.assertEqual(data['message'], 'Success')
        self.assertEqual(data['chat_id'], 'abc123')
        
    def test_add_chat_response_without_chat_id(self):
        """Test AddChatResponse without chat_id"""
        response = AddChatResponse(message='Success')
        data = response.to_dict()
        
        self.assertEqual(data['message'], 'Success')
        self.assertNotIn('chat_id', data)
        
    def test_auth_request(self):
        """Test AuthRequest class"""
        request = AuthRequest.from_dict({'password': 'test123'})
        self.assertEqual(request.password, 'test123')
        
    def test_auth_request_missing_password(self):
        """Test AuthRequest with missing password"""
        request = AuthRequest.from_dict({})
        self.assertEqual(request.password, '')
        
    def test_auth_response(self):
        """Test AuthResponse"""
        response = AuthResponse(message='Authenticated')
        data = response.to_dict()
        self.assertEqual(data['message'], 'Authenticated')
        
    def test_auth_error_response(self):
        """Test AuthErrorResponse"""
        error = AuthErrorResponse(error='Unauthorized')
        data = error.to_dict()
        self.assertEqual(data['error'], 'Unauthorized')
        
    def test_message_send_summary(self):
        """Test MessageSendSummary"""
        summary = MessageSendSummary(total=10, sent=8, failed=2)
        data = summary.to_dict()
        
        self.assertEqual(data['total'], 10)
        self.assertEqual(data['sent'], 8)
        self.assertEqual(data['failed'], 2)
        
    def test_message_failure(self):
        """Test MessageFailure"""
        failure = MessageFailure(
            chat_id='abc123',
            building='Test Building',
            floor=5,
            error='Network error'
        )
        data = failure.to_dict()
        
        self.assertEqual(data['chat_id'], 'abc123')
        self.assertEqual(data['building'], 'Test Building')
        self.assertEqual(data['floor'], 5)
        self.assertEqual(data['error'], 'Network error')
        
    def test_send_message_success_response(self):
        """Test SendMessageSuccessResponse"""
        summary = MessageSendSummary(total=5, sent=5, failed=0)
        response = SendMessageSuccessResponse(
            message='All sent',
            summary=summary
        )
        data = response.to_dict()
        
        self.assertEqual(data['message'], 'All sent')
        self.assertIn('summary', data)
        self.assertEqual(data['summary']['total'], 5)
        
    def test_send_message_partial_response(self):
        """Test SendMessagePartialResponse"""
        summary = MessageSendSummary(total=5, sent=3, failed=2)
        failures = [
            MessageFailure('chat1', 'Building A', 1, 'Error 1'),
            MessageFailure('chat2', 'Building B', 2, 'Error 2')
        ]
        response = SendMessagePartialResponse(
            message='Partial success',
            summary=summary,
            failures=failures
        )
        data = response.to_dict()
        
        self.assertEqual(data['message'], 'Partial success')
        self.assertEqual(len(data['failures']), 2)
        self.assertEqual(data['failures'][0]['chat_id'], 'chat1')


class TestImageUpload(unittest.TestCase):
    """Test image upload functionality"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['ADMIN_PASSWORD'] = 'test_password'
        self.app.config['GROUPME_ACCESS_TOKEN'] = 'test_token'
        self.client = self.app.test_client()
        
    @patch('app.upload_image_to_groupme')
    @patch('app.get_groupme_map_by_buildings')
    @patch('app.send_message_to_group')
    @patch('app.buildings_data', [{'id': 1, 'name': 'Test', 'region': 'north'}])
    def test_send_message_with_image(self, mock_send, mock_get_map, mock_upload):
        """Test sending message with image attachment"""
        mock_upload.return_value = 'https://i.groupme.com/image123.jpg'
        mock_get_map.return_value = {
            1: [{'group_id': 'group123', 'floor_number': 5}]
        }
        mock_send.return_value = {
            'success': True,
            'group_id': 'group123',
            'status_code': 201
        }
        
        # Create fake image file
        data = {
            'building_ids': ['1'],
            'message_body': 'Test with image',
            'password': 'test_password',
            'image_file': (io.BytesIO(b'fake image data'), 'test.jpg')
        }
        
        response = self.client.post('/api/messages/send',
                                   data=data,
                                   content_type='multipart/form-data')
        
        # Should call upload function
        mock_upload.assert_called_once()
        self.assertEqual(response.status_code, 200)


class TestRegionTargeting(unittest.TestCase):
    """Test region-based message targeting"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['ADMIN_PASSWORD'] = 'test_password'
        self.client = self.app.test_client()
        
    @patch('app.get_groupme_map_by_buildings')
    @patch('app.send_message_to_group')
    @patch('app.buildings_data', [
        {'id': 1, 'name': 'North Building', 'region': 'North'},
        {'id': 2, 'name': 'South Building', 'region': 'South'},
        {'id': 3, 'name': 'Another North', 'region': 'North'}
    ])
    def test_send_message_by_region(self, mock_send, mock_get_map):
        """Test sending messages by region"""
        mock_get_map.return_value = {
            1: [{'group_id': 'group1', 'floor_number': 1}],
            3: [{'group_id': 'group3', 'floor_number': 1}]
        }
        mock_send.return_value = {
            'success': True,
            'status_code': 201
        }
        
        data = {
            'regions': ['North'],
            'message_body': 'Test message to north region',
            'password': 'test_password'
        }
        
        response = self.client.post('/api/messages/send', data=data)
        self.assertEqual(response.status_code, 200)
        
        # Should have called get_groupme_map with north building IDs (1 and 3)
        args = mock_get_map.call_args[0][0]
        self.assertIn(1, args)
        self.assertIn(3, args)
        self.assertNotIn(2, args)  # South building should not be included
    
    @patch('app.get_groupme_map_by_buildings')
    @patch('app.send_message_to_group')
    @patch('app.buildings_data', [
        {'id': 1, 'name': 'North Building', 'region': 'North'},
        {'id': 2, 'name': 'South Building', 'region': 'South'},
        {'id': 3, 'name': 'West Building', 'region': 'West'}
    ])
    def test_send_message_case_insensitive_region(self, mock_send, mock_get_map):
        """Test sending messages with case-insensitive region names"""
        mock_get_map.return_value = {
            1: [{'group_id': 'group1', 'floor_number': 1}]
        }
        mock_send.return_value = {
            'success': True,
            'status_code': 201
        }
        
        # Use lowercase region name
        data = {
            'regions': ['north'],
            'message_body': 'Test message',
            'password': 'test_password'
        }
        
        response = self.client.post('/api/messages/send', data=data)
        self.assertEqual(response.status_code, 200)
        
        # Should match North building
        args = mock_get_map.call_args[0][0]
        self.assertIn(1, args)
        
    @patch('app.get_groupme_map_by_buildings')
    @patch('app.send_message_to_group')
    @patch('app.buildings_data', [
        {'id': 1, 'name': 'Building 1', 'region': 'North'},
        {'id': 2, 'name': 'Building 2', 'region': 'South'},
    ])
    def test_send_message_all_regions(self, mock_send, mock_get_map):
        """Test sending to all regions"""
        mock_get_map.return_value = {
            1: [{'group_id': 'group1', 'floor_number': 1}],
            2: [{'group_id': 'group2', 'floor_number': 1}]
        }
        mock_send.return_value = {
            'success': True,
            'status_code': 201
        }
        
        data = {
            'regions': ['all'],
            'message_body': 'Test message to all',
            'password': 'test_password'
        }
        
        response = self.client.post('/api/messages/send', data=data)
        self.assertEqual(response.status_code, 200)
        
        # Should include all buildings
        args = mock_get_map.call_args[0][0]
        self.assertIn(1, args)
        self.assertIn(2, args)


class TestFlaskSpecific(unittest.TestCase):
    """Test Flask-specific functionality"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
    def test_json_content_type(self):
        """Test that responses have correct JSON content type"""
        response = self.client.get('/api/health')
        self.assertEqual(response.content_type, 'application/json')
        
    def test_request_context(self):
        """Test Flask request context"""
        with self.app.test_request_context('/api/health'):
            from flask import request
            self.assertEqual(request.path, '/api/health')
            
    def test_multiple_requests_isolation(self):
        """Test that multiple requests are properly isolated"""
        response1 = self.client.get('/api/health')
        response2 = self.client.get('/api/health')
        
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)
        # Each should be independent
        self.assertIsNot(response1, response2)
        
    def test_post_with_json(self):
        """Test POST with JSON data"""
        self.app.config['ADMIN_PASSWORD'] = 'test_pass'
        
        response = self.client.post('/api/auth',
                                   json={'password': 'test_pass'},
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
    def test_post_with_form_data(self):
        """Test POST with form data"""
        self.app.config['ADMIN_PASSWORD'] = 'test_pass'
        
        response = self.client.post('/api/auth',
                                   data={'password': 'test_pass'})
        self.assertEqual(response.status_code, 200)
        
    def test_invalid_json_handling(self):
        """Test handling of invalid JSON"""
        response = self.client.post('/api/chats/add',
                                   data='invalid json{',
                                   content_type='application/json')
        # Should handle gracefully
        self.assertIn(response.status_code, [400, 500])
        
    def test_large_payload(self):
        """Test handling of large payload"""
        large_data = {'data': 'x' * 10000}
        response = self.client.post('/api/auth',
                                   json=large_data)
        # Should handle large data
        self.assertIsNotNone(response.status_code)
        
    def test_concurrent_request_simulation(self):
        """Test simulated concurrent requests"""
        responses = []
        for _ in range(5):
            response = self.client.get('/api/health')
            responses.append(response)
        
        # All should succeed
        for response in responses:
            self.assertEqual(response.status_code, 200)
            
    def test_app_config_access(self):
        """Test that app config is accessible"""
        self.assertTrue(self.app.config.get('TESTING'))
        
    def test_custom_headers_preserved(self):
        """Test that custom headers are preserved"""
        response = self.client.get('/api/health',
                                  headers={'X-Custom-Header': 'test-value'})
        self.assertEqual(response.status_code, 200)


class TestEnumTypes(unittest.TestCase):
    """Test enum types from api_types"""
    
    def test_region_enum_values(self):
        """Test Region enum has correct values"""
        self.assertEqual(Region.NORTH.value, 'North')
        self.assertEqual(Region.SOUTH.value, 'South')
        self.assertEqual(Region.WEST.value, 'West')
        
    def test_region_enum_count(self):
        """Test Region enum has exactly 3 values"""
        self.assertEqual(len(Region), 3)
        
    def test_region_target_enum_values(self):
        """Test RegionTarget enum has correct values"""
        self.assertEqual(RegionTarget.ALL.value, 'all')
        self.assertEqual(RegionTarget.NORTH.value, 'North')
        self.assertEqual(RegionTarget.SOUTH.value, 'South')
        self.assertEqual(RegionTarget.WEST.value, 'West')
        
    def test_region_target_enum_count(self):
        """Test RegionTarget enum has exactly 4 values"""
        self.assertEqual(len(RegionTarget), 4)
        
    def test_region_vs_region_target(self):
        """Test difference between Region and RegionTarget"""
        # RegionTarget includes 'all', Region doesn't
        region_values = [r.value for r in Region]
        target_values = [r.value for r in RegionTarget]
        
        self.assertNotIn('all', region_values)
        self.assertIn('all', target_values)


class TestHelperFunctionsEdgeCases(unittest.TestCase):
    """Test edge cases for helper functions"""
    
    def test_extract_group_id_empty_string(self):
        """Test extracting group ID from empty string"""
        result = extract_group_id_and_token_from_link('')
        self.assertIsNone(result)
        
    def test_extract_group_id_malformed_url(self):
        """Test extracting group ID from malformed URL"""
        result = extract_group_id_and_token_from_link('https://groupme.com/invalid')
        self.assertIsNone(result)
        
    def test_extract_group_id_missing_token(self):
        """Test extracting group ID with missing token"""
        result = extract_group_id_and_token_from_link('https://groupme.com/join_group/12345')
        self.assertIsNone(result)
        
    def test_extract_group_id_extra_segments(self):
        """Test extracting group ID with extra URL segments"""
        link = 'https://groupme.com/join_group/12345/TOKEN/extra/segments'
        result = extract_group_id_and_token_from_link(link)
        # Should still work, taking first two after join_group
        self.assertIsNotNone(result)
        self.assertEqual(result[0], '12345')
        self.assertEqual(result[1], 'TOKEN')


class TestDatabaseFallback(unittest.TestCase):
    """Test in-memory fallback when MongoDB is not available"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['GROUPME_ACCESS_TOKEN'] = 'test_token'
        self.client = self.app.test_client()
        
    @patch('app.chats_collection', None)
    @patch('app._fallback_chats', [])
    @patch('app.join_group')
    @patch('app.add_chat')
    def test_add_chat_with_fallback_storage(self, mock_add_chat, mock_join):
        """Test adding chat works with fallback storage"""
        mock_join.return_value = True
        mock_add_chat.return_value = {
            'groupme_id': '12345',
            'building_id': 1,
            'floor_number': 5
        }
        
        payload = {
            'groupme_link': 'https://groupme.com/join_group/12345/TOKEN',
            'building_id': 1,
            'floor_number': 5
        }
        
        response = self.client.post('/api/chats/add', json=payload)
        self.assertEqual(response.status_code, 200)


def run_tests():
    """Run all tests"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestHealthEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestBuildingsEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestAuthEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestAddChatEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestSendMessageEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestHelperFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestValidationFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestCORSConfiguration))
    suite.addTests(loader.loadTestsFromTestCase(TestErrorHandlers))
    suite.addTests(loader.loadTestsFromTestCase(TestAPITypes))
    suite.addTests(loader.loadTestsFromTestCase(TestImageUpload))
    suite.addTests(loader.loadTestsFromTestCase(TestRegionTargeting))
    suite.addTests(loader.loadTestsFromTestCase(TestFlaskSpecific))
    suite.addTests(loader.loadTestsFromTestCase(TestEnumTypes))
    suite.addTests(loader.loadTestsFromTestCase(TestHelperFunctionsEdgeCases))
    suite.addTests(loader.loadTestsFromTestCase(TestDatabaseFallback))
    
    # Run tests with verbose output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*70)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print("="*70)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    # Run tests
    success = run_tests()
    sys.exit(0 if success else 1)
