const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//set up middle wares
app.use(express.json());
app.use(cors({ origin: true }));

//require dotenv
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.c2bp6su.mongodb.net/?retryWrites=true&w=majority`;
console.log("Mongo set up For Job Nexus: ", uri);





// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        const usersCollection = client.db('Moon_Tech_Redux_Thunk').collection('users');
        const jobsCollection = client.db('Moon_Tech_Redux_Thunk').collection('jobs');

    
        app.post('/addUser', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = {
                email: user.email
            }
            const findAlreadyUserInDataBase = await usersCollection.find(query).toArray();
            console.log("User already in database", findAlreadyUserInDataBase.length);
            if (findAlreadyUserInDataBase.length) {
                const message = 'This Email Already Exists';
                return res.send({ acknowledged: false, message });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

    }
    finally {

    }
}

run().catch(error => console.log(error))

app.get("/", (req, res) => {
    res.send("Job Nexus Server!");
});

app.listen(port, () => {
    console.log(`Job Nexus Server is Running on port ${port}`);
});
