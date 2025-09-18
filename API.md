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
      "trafficPercentage": 50
    },
    {
      "name": "Treatment",
      "trafficPercentage": 50
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Experiment created successfully",
  "experiment": {
    "id": "1704412800123",
    "name": "New Experiment",
    "description": "Description of the experiment",
    "status": "draft",
    "variants": [
      {
        "id": "variant-1704412800123-0",
        "name": "Control",
        "trafficPercentage": 50,
        "conversions": 0,
        "visitors": 0
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

### Update Experiment
Update an experiment's properties such as name, description, variants, etc.

**PATCH** `/experiments/:id`

**Parameters:**
- `id` (string): The experiment ID

**Request Body (all fields optional):**
```json
{
  "name": "Updated Experiment Name",
  "description": "Updated description",
  "status": "draft",
  "variants": [
    {
      "name": "Control",
      "weight": 50,
      "config": {}
    },
    {
      "name": "Treatment",
      "weight": 50,
      "config": {}
    }
  ],
  "targetingRules": [
    {
      "type": "percentage",
      "value": 100
    }
  ],
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z"
}
```

**Success Response:**
```json
{
  "id": "1",
  "name": "Updated Experiment Name",
  "description": "Updated description",
  "status": "draft",
  "variants": [...],
  "targetingRules": [...],
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2025-09-05T19:01:28.806Z"
}
```

**Error Responses:**
- **404:** Experiment not found
```json
{
  "error": "Experiment not found",
  "message": "The requested experiment could not be found"
}
```

- **400:** Invalid variant weights
```json
{
  "error": "Invalid variant weights",
  "message": "Variant weights must sum to 100"
}
```

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