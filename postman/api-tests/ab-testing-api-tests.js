// Postman test scripts for AB Testing API
// Each request's test script is included below. Place these in the appropriate Postman request test tabs.

// Get all experiments
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Response is an array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});
pm.test("Each experiment has required fields", function () {
    var jsonData = pm.response.json();
    jsonData.forEach(function(exp) {
        pm.expect(exp).to.have.property('id');
        pm.expect(exp).to.have.property('name');
        pm.expect(exp).to.have.property('variants');
    });
});
pm.test("Handles empty list", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.length).to.be.at.least(0);
});

// Create a new experiment
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});
pm.test("Experiment created with required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('name');
    pm.expect(jsonData).to.have.property('variants');
    pm.expect(jsonData).to.have.property('targeting');
});
pm.test("Handles 400 error", function () {
    if (pm.response.code === 400) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('error');
    }
});

// Get experiment by ID
pm.test("Status code is 200 or 404", function () {
    pm.expect([200,404]).to.include(pm.response.code);
});
pm.test("Experiment has required fields if found", function () {
    if (pm.response.code === 200) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('id');
        pm.expect(jsonData).to.have.property('name');
        pm.expect(jsonData).to.have.property('variants');
    }
});
pm.test("Handles not found error", function () {
    if (pm.response.code === 404) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('error');
    }
});

// Update experiment
pm.test("Status code is 200 or 404", function () {
    pm.expect([200,404]).to.include(pm.response.code);
});
pm.test("Experiment updated with required fields if found", function () {
    if (pm.response.code === 200) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('id');
        pm.expect(jsonData).to.have.property('name');
        pm.expect(jsonData).to.have.property('variants');
    }
});
pm.test("Handles not found error", function () {
    if (pm.response.code === 404) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('error');
    }
});

// Delete experiment
pm.test("Status code is 204 or 404", function () {
    pm.expect([204,404]).to.include(pm.response.code);
});
pm.test("Response body is empty for 204", function () {
    if (pm.response.code === 204) {
        pm.expect(pm.response.text()).to.eql("");
    }
});
pm.test("Handles not found error", function () {
    if (pm.response.code === 404) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('error');
    }
});

// Assign user to variant
pm.test("Status code is 200 or 404", function () {
    pm.expect([200,404]).to.include(pm.response.code);
});
pm.test("Assigned variant structure if found", function () {
    if (pm.response.code === 200) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('variant');
    }
});
pm.test("Handles not found error", function () {
    if (pm.response.code === 404) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('error');
    }
});

// Track conversion event
pm.test("Status code is 200 or 404", function () {
    pm.expect([200,404]).to.include(pm.response.code);
});
pm.test("Event confirmation if found", function () {
    if (pm.response.code === 200) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('success');
    }
});
pm.test("Handles not found error", function () {
    if (pm.response.code === 404) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('error');
    }
});

// Get experiment results
pm.test("Status code is 200 or 404", function () {
    pm.expect([200,404]).to.include(pm.response.code);
});
pm.test("Analytics structure if found", function () {
    if (pm.response.code === 200) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('results');
    }
});
pm.test("Handles not found error", function () {
    if (pm.response.code === 404) {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('error');
    }
});

// Health check endpoint
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Response is a valid JSON object", function () {
    pm.response.to.be.json;
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('object');
});
pm.test("Response contains status and timestamp", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData.status).to.be.oneOf(['OK', 'ERROR']);
    pm.expect(jsonData).to.have.property('timestamp');
    pm.expect(new Date(jsonData.timestamp)).to.be.a('date');
});
pm.test("Handles error status", function () {
    var jsonData = pm.response.json();
    if (jsonData.status === 'ERROR') {
        pm.expect(jsonData).to.have.property('error');
    }
});
