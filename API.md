# A/B Testing API Documentation

This document describes the REST API endpoints for managing A/B testing experiments.

## Base URL
```
http://localhost:3002/api
```

## Authentication
Currently, no authentication is required for API endpoints.

## Endpoints

### Health Check
Check if the API server is running and get basic status information.

**GET** `/health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-05T19:01:42.316Z",
  "experimentsCount": 2
}
```

### Get All Experiments
Retrieve all experiments.

**GET** `/experiments`

**Response:**
```json
[
  {
    "id": "1",
    "name": "Homepage CTA Button Test",
    "description": "Testing blue vs red CTA button color on homepage",
    "status": "draft",
    "variants": [
      {
        "id": "variant-1",
        "name": "Control (Blue)",
        "trafficPercentage": 50,
        "conversions": 0,
        "visitors": 0
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Experiment by ID
Retrieve a specific experiment by its ID.

**GET** `/experiments/:id`

**Parameters:**
- `id` (string): The experiment ID

**Response:**
```json
{
  "id": "1",
  "name": "Homepage CTA Button Test",
  "description": "Testing blue vs red CTA button color on homepage",
  "status": "draft",
  "variants": [...],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Experiment not found"
}
```

### Start an Experiment
Start a draft experiment. This will change the status from 'draft' to 'running' and set the start date.

**POST** `/experiments/:id/start`

**Parameters:**
- `id` (string): The experiment ID

**Success Response:**
```json
{
  "success": true,
  "message": "Experiment started successfully",
  "experiment": {
    "id": "1",
    "status": "running",
    "startDate": "2025-09-05T19:01:28.806Z",
    "updatedAt": "2025-09-05T19:01:28.806Z"
    // ... other experiment fields
  }
}
```

**Error Responses:**
- **404:** Experiment not found
```json
{
  "error": "Experiment not found"
}
```

- **400:** Invalid status transition
```json
{
  "error": "Experiment cannot be started. Current status: completed"
}
```

- **400:** Invalid traffic allocation
```json
{
  "error": "Traffic allocation must equal 100%. Current total: 90%"
}
```

### Stop an Experiment
Stop a running experiment. This will change the status from 'running' to 'completed' and set the end date.

**POST** `/experiments/:id/stop`

**Parameters:**
- `id` (string): The experiment ID

**Success Response:**
```json
{
  "success": true,
  "message": "Experiment stopped successfully",
  "experiment": {
    "id": "1",
    "status": "completed",
    "endDate": "2025-09-05T19:01:31.950Z",
    "updatedAt": "2025-09-05T19:01:31.950Z"
    // ... other experiment fields
  }
}
```

**Error Responses:**
- **404:** Experiment not found
```json
{
  "error": "Experiment not found"
}
```

- **400:** Invalid status transition
```json
{
  "error": "Experiment cannot be stopped. Current status: draft"
}
```

### Create a New Experiment
Create a new experiment with the provided data.

**POST** `/experiments`

**Request Body:**
```json
{
  "name": "New Experiment",
  "description": "Description of the experiment",
  "variants": [
    {
      "name": "Control",
      "weight": 50,
      "config": {
        "buttonColor": "#007bff"
      }
    },
    {
      "name": "Treatment",
      "weight": 50,
      "config": {
        "buttonColor": "#dc3545"
      }
    }
  ],
  "segmentationRules": [
    {
      "field": "country",
      "operator": "equals",
      "value": "US"
    },
    {
      "field": "device",
      "operator": "in",
      "value": ["mobile", "tablet"]
    },
    {
      "field": "age",
      "operator": "greater_than",
      "value": 18
    }
  ]
}
```

**Segmentation Rules:**
Segmentation rules allow you to define which users are eligible for the experiment based on their attributes.

**Supported Operators:**
- `equals`: Exact match (e.g., country equals "US")
- `not_equals`: Not equal to value
- `in`: Value is in array (e.g., device in ["mobile", "tablet"])
- `not_in`: Value is not in array
- `greater_than`: Numeric comparison (e.g., age > 18)
- `less_than`: Numeric comparison (e.g., age < 65)
- `contains`: String contains substring

**Field Examples:**
- `country`: "US", "UK", "CA"
- `device`: "mobile", "tablet", "desktop"
- `age`: numeric value
- `premium`: boolean or string
- `userType`: "new", "returning", "vip"

**Success Response (201):**
```json
{
  "id": "exp_123",
  "name": "New Experiment",
  "description": "Description of the experiment",
  "status": "draft",
  "variants": [
    {
      "name": "Control",
      "weight": 50,
      "config": {
        "buttonColor": "#007bff"
      }
    },
    {
      "name": "Treatment", 
      "weight": 50,
      "config": {
        "buttonColor": "#dc3545"
      }
    }
  ],
  "segmentationRules": [
    {
      "field": "country",
      "operator": "equals", 
      "value": "US"
    },
    {
      "field": "device",
      "operator": "in",
      "value": ["mobile", "tablet"]
    }
  ],
    "createdAt": "2024-01-04T20:00:00.123Z",
    "updatedAt": "2024-01-04T20:00:00.123Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields: name, description, and variants"
}
```

**Error Response (400) - Invalid Segmentation Rules:**
```json
{
  "error": "Invalid segmentation rules",
  "message": "Segmentation rule must have a valid field name"
}
```

### Assign User to Experiment Variant
Assign a user to a variant in an experiment. Users must match segmentation rules if they are defined for the experiment.

**POST** `/experiments/:id/assign`

**Parameters:**
- `id` (string): The experiment ID

**Request Body:**
```json
{
  "userId": "user123",
  "attributes": {
    "country": "US",
    "device": "mobile", 
    "age": 25,
    "premium": true
  }
}
```

**For experiments with segmentation rules:**
- `userId` is required
- `attributes` is required and must contain all fields referenced in segmentation rules
- User must match ALL segmentation rules to be eligible

**For experiments without segmentation rules:**
- Only `userId` is required
- `attributes` is optional

**Success Response - Eligible User (200):**
```json
{
  "experimentId": "exp_123",
  "userId": "user123",
  "variant": {
    "name": "treatment",
    "weight": 50,
    "config": {
      "buttonColor": "#dc3545"
    }
  },
  "assignedAt": "2025-01-01T12:00:00.000Z",
  "eligible": true
}
```

**Success Response - Ineligible User (200):**
```json
{
  "experimentId": "exp_123",
  "userId": "user456",
  "eligible": false,
  "message": "User does not match segmentation criteria for this experiment"
}
```

**Error Responses:**
- **404:** Experiment not found
- **400:** Missing userId
- **400:** Missing user attributes (for experiments with segmentation rules)

### Update Experiment Status (Generic)
Update an experiment's status directly. This is a more flexible alternative to the specific start/stop endpoints.

**PATCH** `/experiments/:id/status`

**Parameters:**
- `id` (string): The experiment ID

**Request Body:**
```json
{
  "status": "running"
}
```

**Valid statuses:** `draft`, `running`, `completed`

**Success Response:**
```json
{
  "success": true,
  "message": "Experiment status updated to running",
  "experiment": {
    "id": "1",
    "status": "running",
    "startDate": "2025-09-05T19:01:28.806Z", // Added when transitioning to running
    "updatedAt": "2025-09-05T19:01:28.806Z"
    // ... other experiment fields
  }
}
```

**Error Responses:**
- **404:** Experiment not found
- **400:** Invalid status value

## Status Transitions

Experiments have three possible states with the following valid transitions:

- `draft` → `running` (sets `startDate`)
- `running` → `completed` (sets `endDate`)
- Any status → Any status (using generic status update endpoint)

## Data Types

### Experiment Status
- `draft`: Experiment is created but not started
- `running`: Experiment is active and collecting data
- `completed`: Experiment has been stopped

### Traffic Allocation
- All variant `trafficPercentage` values must sum to 100% for an experiment to be startable
- Traffic percentages can be decimals (e.g., 33.33%)

## Error Handling

All error responses follow the format:
```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created (for new experiments)
- `400`: Bad request (validation errors)
- `404`: Not found
- `500`: Internal server error

## Development

### Starting the Server
```bash
npm run server
```

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable.

### Running Both Frontend and Backend
```bash
npm run dev
```

This will start both the API server (port 3001) and the React frontend (port 3002) concurrently.