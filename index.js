const express = require("express")
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 6007
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// import { ObjectId } from "mongodb";
require('dotenv').config()

app.use(express.json())
app.use(cors())

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

    app.get('/doctorInfo', async(req,res)=>{
        const cursor = doctorServiceCollection.find()
        const result = await cursor.toArray()
        res.send(result)
       
       
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
    
            console.log("Query Result:", result);
            res.send(result);
        } catch (error) {
            console.error("Database query error:", error.message);
            res.status(500).send({ error: "Internal server error" });
        }
    });
    

    // Doctor Booked and Post Areqa
    app.post("/doctorBooking", async(req,res)=>{
        const cursor = req.body 
        const bookingResult = await bookingCollection.insertOne(cursor)
        res.send(bookingResult);
        
    })

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
      
    

    await client.db("admin").command({ ping: 1 });
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