const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

const PORT = 3000;

// Odoo configuration
const ODOO_URL = "http://odoo.odoo.svc.cluster.local:8069";
const ODOO_DB = "odoo";

// For now, these are environment variables.
// We will move them to Kubernetes Secrets afterward.
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_PASSWORD = process.env.ODOO_PASSWORD;

app.use(cors());
app.use(express.json());


// --------------------------------------------------
// Basic API health/test endpoint
// --------------------------------------------------

app.get("/api/hello", (req, res) => {
    res.json({
        message: "Hello from backend API"
    });
});


// --------------------------------------------------
// Odoo authentication
// --------------------------------------------------

async function authenticateOdoo() {

    const response = await axios.post(
        `${ODOO_URL}/jsonrpc`,
        {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "common",
                method: "authenticate",
                args: [
                    ODOO_DB,
                    ODOO_USERNAME,
                    ODOO_PASSWORD,
                    {}
                ]
            },
            id: 1
        },
        {
            timeout: 10000
        }
    );

    return response.data.result;
}


// --------------------------------------------------
// Test Odoo connection
// --------------------------------------------------

app.get("/api/odoo", async (req, res) => {

    try {

        if (!ODOO_USERNAME || !ODOO_PASSWORD) {

            return res.status(500).json({
                error: "ODOO_USERNAME or ODOO_PASSWORD environment variable is missing"
            });

        }

        const uid = await authenticateOdoo();

        if (!uid) {

            return res.status(401).json({
                error: "Odoo authentication failed"
            });

        }

        res.json({
            message: "Successfully connected to Odoo",
            odoo_url: ODOO_URL,
            database: ODOO_DB,
            uid: uid
        });

    } catch (error) {

        console.error("Odoo connection error:");

        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        res.status(500).json({
            error: "Failed to connect to Odoo",
            details: error.message
        });
    }
});


// --------------------------------------------------
// Get Odoo users
// --------------------------------------------------

app.get("/api/odoo/users", async (req, res) => {

    try {

        if (!ODOO_USERNAME || !ODOO_PASSWORD) {

            return res.status(500).json({
                error: "Odoo credentials are missing"
            });

        }

        const uid = await authenticateOdoo();

        if (!uid) {

            return res.status(401).json({
                error: "Odoo authentication failed"
            });

        }

        const response = await axios.post(
            `${ODOO_URL}/jsonrpc`,
            {
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "object",
                    method: "execute_kw",
                    args: [
                        ODOO_DB,
                        uid,
                        ODOO_PASSWORD,

                        // Odoo model
                        "res.users",

                        // Method
                        "search_read",

                        // Domain
                        [[]],

                        // Fields
                        {
                            fields: [
                                "id",
                                "name",
                                "login",
                                "active"
                            ],
                            limit: 20
                        }
                    ]
                },
                id: 2
            },
            {
                timeout: 10000
            }
        );

        res.json({
            users: response.data.result
        });

    } catch (error) {

        console.error("Odoo users error:");

        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        res.status(500).json({
            error: "Failed to retrieve Odoo users",
            details: error.message
        });
    }
});


// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {

    console.log(`API listening on port ${PORT}`);

});
