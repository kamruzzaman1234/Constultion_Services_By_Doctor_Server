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
        'http://localhost:5173',
        'https://service-by-doctor-project.web.app',
        'https://service-by-doctor-project.firebaseapp.com'
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
    console.log("Value of the token is ", token)
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
const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production" ? true : false
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
    const contactCollection = client.db('doctor_service_booking').collection('contactInfo')

    //  Token Generate
    app.post('/jwt', logger, (req, res)=>{
        const user = req.body 
        console.log(user)
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_KEY,
           {expiresIn: '1h'})
           
          res.
        cookie('token',  token, cookieOptions)
        .send({success: true})
      })


      // Show All Data
      app.get('/doctorInfo', logger, async(req,res)=>{
          const cursor = doctorServiceCollection.find()
          const result = await cursor.toArray()
          res.send(result)
         
         
      })

      // Show All Data with Pagination
     app.get('/doctorInfo', async (req, res) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4; 
  const skip = (page - 1) * limit; 

  try {
      const cursor = doctorServiceCollection.find().skip(skip).limit(limit); 
      const result = await cursor.toArray();
      
      
      const totalItems = await doctorServiceCollection.countDocuments();
      const totalPages = Math.ceil(totalItems / limit); 

      res.send({
          image:image,

          data: result,
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems
      });
  } catch (error) {
      console.error("Error fetching paginated data:", error);
      res.status(500).send({ error: "Internal server error" });
  }
});

    // Post doctor Info
    app.post('/contact', async(req,res)=>{
       const addContact = req.body 
       const result = await contactCollection.insertOne(addContact)
       console.log(result)
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
    
    app.get("/doctorBooking", async (req, res) => {
      const result = await bookingCollection.find().toArray();
      res.send(result);
      console.log("Your result is ", result)
    });

    // Doctor Booked and Post Areqa
    app.post("/doctorBooking", async (req, res) => {
      const newBooking = req.body;
      const { startDate, endDate, doctorId } = newBooking;
  
      try {
          
          const existingBooking = await bookingCollection.findOne({
              doctorId: doctorId,
              $or: [
                  { startDate: { $lte: endDate, $gte: startDate } },
                  { endDate: { $lte: endDate, $gte: startDate } }
              ]
          });
  
          
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


app.delete('/doctorBooking/:id', async(req,res)=>{
  const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const result = await bookingCollection.deleteOne(query)
  res.send(result)
})
    
    
    

app.patch("/doctorBooking/:id", logger, verifyToken, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { status: req.body.status } };
  const result = await bookingCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// Delete
app.delete("/doctorBooking/:id", async (req, res) => {
  const id = req.params.id;
  const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

   
      
      // 
      // POST route for booking an appointment
app.post('/book-appointment', async (req, res) => {
  const { doctorId, patientName, date, time } = req.body;

  try {
    const newAppointment = new Appointment({ doctorId, patientName, date, time });
    await newAppointment.save();
    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Failed to book appointment' });
  }
});
    

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