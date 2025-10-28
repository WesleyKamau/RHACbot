/**
 * TypeScript types generated from OpenAPI specification (openapi.yaml)
 * These types match the backend API contracts
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * Standard error response from the API
 */
export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  status: number;
  data: T;
}

// ============================================================================
// Building Types
// ============================================================================

/**
 * Valid region names for buildings
 */
export type Region = "North" | "South" | "West";

/**
 * Valid region targeting options (includes "all" for message broadcasting)
 */
export type RegionTarget = "all" | Region;

/**
 * Building information from the database
 */
export interface Building {
  id: number; // 0-40
  name: string;
  address: string;
  region: Region;
}

// ============================================================================
// Health Check Types
// ============================================================================

/**
 * Response from the health check endpoint
 */
export interface HealthCheckResponse {
  status: "ok";
  message: string;
}

// ============================================================================
// Chat Management Types
// ============================================================================

/**
 * Request payload for adding a floor chat
 */
export interface AddChatRequest {
  groupme_link: string;
  building_id: number; // 0-40
  floor_number: number; // minimum: 1
}

/**
 * Response from adding a chat
 */
export interface AddChatResponse {
  message: string;
  chat_id?: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Request payload for authentication
 */
export interface AuthRequest {
  password: string;
}

/**
 * Response from authentication
 */
export interface AuthResponse {
  message: string;
}

/**
 * Error response from authentication
 */
export interface AuthErrorResponse {
  error: string;
}

// ============================================================================
// Message Broadcasting Types
// ============================================================================

/**
 * Request payload for sending messages
 * Note: This is sent as FormData, not JSON
 */
export interface SendMessageRequest {
  password: string;
  message_body: string; // max 1000 characters
  image_file?: File;
  regions?: RegionTarget[];
  building_ids?: string[]; // string representation of building IDs (0-40)
}

/**
 * Summary of message sending results
 */
export interface MessageSendSummary {
  total: number;
  sent: number;
  failed: number;
}

/**
 * Information about a failed message delivery
 */
export interface MessageFailure {
  chat_id: string;
  building: string;
  floor: number;
  error: string;
}

/**
 * Response from sending messages (all successful)
 */
export interface SendMessageSuccessResponse {
  message: string;
  summary: MessageSendSummary;
}

/**
 * Response from sending messages (partial failure)
 */
export interface SendMessagePartialResponse {
  message: string;
  summary: MessageSendSummary;
  failures: MessageFailure[];
}

/**
 * Union type for all possible send message responses
 */
export type SendMessageResponse = 
  | SendMessageSuccessResponse 
  | SendMessagePartialResponse 
  | ApiError;

// ============================================================================
// Form Types (for UI components)
// ============================================================================

/**
 * Form values for add chat page
 */
export interface AddChatFormValues {
  groupme_link: string;
  building_id: number;
  floor_number: number;
}

/**
 * Form values for send message page
 */
export interface SendMessageFormValues {
  message_body: string;
  image_file?: File;
  targetAudience?: any[]; // TreeSelect returns complex objects with value/label
}

/**
 * TreeSelect node structure for building/region selection
 */
export interface TreeSelectNode {
  title: string;
  value: string;
  selectable: boolean;
  children?: TreeSelectNode[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a response is an error
 */
export function isApiError(response: any): response is ApiError {
  return response && typeof response.error === 'string';
}

/**
 * Type guard to check if send message response has failures
 */
export function hasMessageFailures(
  response: SendMessageResponse
): response is SendMessagePartialResponse {
  return (
    !isApiError(response) &&
    'failures' in response &&
    Array.isArray(response.failures)
  );
}

/**
 * Type guard to check if a region is valid
 */
export function isValidRegion(region: string): region is Region {
  return region === "North" || region === "South" || region === "West";
}

/**
 * Type guard to check if a region target is valid (includes "all")
 */
export function isValidRegionTarget(region: string): region is RegionTarget {
  return region === "all" || isValidRegion(region);
}

/**
 * Type guard to check if building ID is in valid range
 */
export function isValidBuildingId(id: number): boolean {
  return Number.isInteger(id) && id >= 0 && id <= 40;
}
