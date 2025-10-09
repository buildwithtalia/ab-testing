// Postman test scripts for AB Testing API endpoints
// Each script validates status, structure, and business logic
// Add these to your Postman collection or requests as needed

// Example for Get all experiments
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Response is array of experiments", function () {
    var jsonData = pm.response.json();
    pm.expect(Array.isArray(jsonData)).to.be.true;
    if(jsonData.length) {
        pm.expect(jsonData[0]).to.have.property('id');
        pm.expect(jsonData[0]).to.have.property('name');
    }
});

// Example for Create a new experiment
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});
pm.test("Experiment created has id", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
});

// Example for Create User Segment
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});
pm.test("Segment created has id", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
});

// Example for Assign user to variant
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Assignment response has variant", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('variant');
});

// Example for Track conversion event
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Conversion tracked", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
});

// Example for Delete experiment
pm.test("Status code is 200 or 204", function () {
    pm.expect([200,204]).to.include(pm.response.code);
});

// Example for Update experiment
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Experiment updated has id", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
});

// Example for Get experiment by ID
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Experiment object returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
});

// Example for Health check endpoint
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Health check response", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('status');
});
