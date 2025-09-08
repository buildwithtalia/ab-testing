import requests
import pytest

BASE_URL = "http://localhost:3000/api"  # Update as needed

@pytest.fixture
def experiment_payload():
    return {
        "name": "Button Color Test",
        "description": "Testing different button colors for conversion",
        "variants": [
            {
                "name": "control",
                "weight": 50,
                "config": {
                    "buttonColor": "#007bff"
                }
            },
            {
                "name": "red_button",
                "weight": 50,
                "config": {
                    "buttonColor": "#dc3545"
                }
            }
        ],
        "targetingRules": [
            {
                "type": "percentage",
                "value": 100
            }
        ]
    }

def test_create_experiment_success(experiment_payload):
    response = requests.post(f"{BASE_URL}/experiments", json=experiment_payload)
    assert response.status_code == 201
    data = response.json()
    assert isinstance(data, dict)
    assert "id" in data
    assert data["name"] == experiment_payload["name"]
    assert "variants" in data and isinstance(data["variants"], list)
    assert "targetingRules" in data and isinstance(data["targetingRules"], list)
    for variant in data["variants"]:
        assert "name" in variant
        assert "weight" in variant
        assert "config" in variant
    for rule in data["targetingRules"]:
        assert "type" in rule
        assert "value" in rule

def test_create_experiment_invalid_input():
    # Missing required fields
    payload = {"name": ""}
    response = requests.post(f"{BASE_URL}/experiments", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
