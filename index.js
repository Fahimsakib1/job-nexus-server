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

//require jwt
const jwt = require('jsonwebtoken');


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



//verify JWT Function
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send('Unauthorized Access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })

}




async function run() {
    try {
        const usersCollection = client.db('Moon_Tech_Redux_Thunk').collection('users');
        const jobsCollection = client.db('Moon_Tech_Redux_Thunk').collection('jobs');

        //add user after sign up
        app.post('/addUser', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = {
                email: user.email,
                signUpType: 'NormalSignUp'
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

        
        //Get All jobs
        app.get('/allJobs', async (req, res) => {
            const query = {};
            const result = await jobsCollection.find(query).toArray()
            res.send(result);
        })




        //post job by verifying JWT
        app.post('/addJob', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const jobDetails = req.body;
            const result = await jobsCollection.insertOne(jobDetails)
            res.send(result);
        })

        //Get a specific job
        app.get('/allJobs/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(query)
            res.send(result);
        })

        //Get specific jobs by user email
        app.get('/jobsByEmail/:email', async (req, res) => {
            const email = req.params.email
            const query = { userEmail: email };
            const result = await jobsCollection.find(query).toArray()
            res.send(result);
        })


        //delete a specific job
        app.delete('/job/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const id = req.params.id
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.deleteOne(query)
            res.send(result);
        })

        //Get specific jobs by user email
        app.get('/myJobs/:email', async (req, res) => {
            const email = req.params.email
            const query = { userEmail: email };
            const result = await jobsCollection.find(query).toArray()
            res.send(result);
        })


        //Update a Product
        app.put('/updateJob/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const check = { email: decodedEmail };
            const user = await usersCollection.findOne(check);
            if (user?.email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedJobInfo = req.body;
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    jobTitle: updatedJobInfo.jobTitle,
                    jobResponsibilities: updatedJobInfo.jobResponsibilities,
                    jobRequirements: updatedJobInfo.jobRequirements,
                    vacancy: updatedJobInfo.vacancy,
                    experience: updatedJobInfo.experience,
                    education: updatedJobInfo.education,
                    location: updatedJobInfo.location,
                    jobType: updatedJobInfo.jobType,
                    salary: updatedJobInfo.salary,
                    jobEditedTime: updatedJobInfo.jobEditedTime
                }
            }
            const result = await jobsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })




        ///////// JWT Token Code Starts ////////////////

        //generate token when the user signs up 
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            console.log("JWT", email)
            const query = { email: email }

            const user = await usersCollection.findOne(query)
            //console.log(user);

            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            else {
                return res.status(403).send({ accessToken: 'User not Found' })
            }
        })

        //code for jwt token when the user login to the system
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log("User From Sever side: ", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            res.send({ token })
        })

        ///////// JWT Token Code Ends ////////////////




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
