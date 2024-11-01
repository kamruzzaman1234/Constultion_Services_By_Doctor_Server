const express = require("express")
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 6007
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// import { ObjectId } from "mongodb";
require('dotenv').config()


app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const logger = async(req,res,next)=>{
    console.log('Called', req.host, req.originalUrl)
    next()
}

const verifyToken = async(req, res, next)=>{
    const token = req.cookies?.token
    console.log("Value of the token is ",token)
      if(!token){
        return res.status(401).send({
          message: "not authorized"
        })
      }
  
      jwt.verify(token, process.env.ACCESS_JSON_TOKEN, (err, decoded)=>{
          if(err){
            console.log(err)
            return res.status(401).send({message: 'un authorize'})
          }
          console.log('Value in the token is', decoded)
          req.user = decoded
           next()
      })
      
   
  }

app.get('/', (req, res)=>{
    res.send("Hello Server !! Welcome to My Server Site")
})


const uri = `mongodb+srv://${process.env.USER_DOC}:${process.env.USER_PASS}@cluster0.7olulz0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const doctorServiceCollection = client.db('doctor_service_booking').collection('doctor_info')
    const bookingCollection = client.db('doctor_service_booking').collection('doctorBooked')

  

    // Show All Data
    app.get('/doctorInfo', async(req,res)=>{
        const cursor = doctorServiceCollection.find()
        const result = await cursor.toArray()
        res.send(result)
       
       
    })
    app.post('/doctorInfo', async(req,res)=>{
        const addBooking = req.body 
        const result = await doctorServiceCollection.insertOne(addBooking)
        res.send(result);
        console.log(result)
    })

    

     



    app.get('/doctorInfo/:id', async (req, res) => {
        const id = req.params.id;
   
        let query;
        try {
            query = { _id: id };
        } catch (error) {
            console.error("Invalid ObjectId format:", error.message);
            return res.status(400).send({ error: "Invalid ID format" });
        }
    
        const options = {
            projection: {
                image: 1,
                price: 1,
                location: 1,
                description: 1,
                rating: 1,
                medical_name: 1,
                title: 1,
                experience: 1,
                name: 1,
                join_time: 1,
                online_service_time: 1,
                offline_service_time: 1,
            }
        };
    
        try {
            
            const result = await doctorServiceCollection.findOne(query,options);
            
           
            if (!result) {
                console.log("No document found with the provided ID.");
                return res.status(404).send({ message: "Doctor not found" });
            }
    
            
            res.send(result);
        } catch (error) {
            console.error("Database query error:", error.message);
            res.status(500).send({ error: "Internal server error" });
        }
    });
    

    // Doctor Booked and Post Areqa
    app.post("/doctorBooking", async (req, res) => {
        const newBooking = req.body;
        const { startDate, endDate, doctorId } = newBooking;
    
        try {
            // Prothome oi doctor er jei date range startDate theke endDate, sheta already ache kina check kora hocche
            const existingBooking = await bookingCollection.findOne({
                doctorId: doctorId,
                $or: [
                    { startDate: { $lte: endDate, $gte: startDate } },
                    { endDate: { $lte: endDate, $gte: startDate } }
                ]
            });
    
            // Jodi booking thake, tahole error response pathano hobe
            if (existingBooking) {
                return res.status(409).send({ error: "This time slot is already booked. Please choose a different time." });
            }
    
            // Jodi booking na thake, tahole new booking insert kora hobe
            const bookingResult = await bookingCollection.insertOne(newBooking);
            res.send(bookingResult);
        } catch (error) {
            console.error("Error creating booking:", error);
            res.status(500).send({ error: "Failed to create booking" });
        }
    });
    

    app.get('/doctorBooking', async(req,res)=>{
        const cursor = bookingCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.delete('/doctorBooking/:id', async(req,res)=>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await bookingCollection.deleteOne(query)
        res.send(result)
    })

    // Patch
    app.patch('/doctorBooking/:id', async(req,res)=>{
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const updateBooking = req.body 
        console.log(updateBooking)
        const updateDoc = {
          $set: {
            status: updateBooking.status
          }
        }
        const result = await bookingCollection.updateOne(filter, updateDoc)
        res.send(result)
      })
      
    

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(PORT, (req,res)=>{
    console.log(`Server is Running and PORT is ${PORT}`)
})