const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send(
    "<h1 style='text-align:center; color : purple'>Car doctor Server</h1>"
  );
});

const uri = process.env.dbURL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const servicesCollection = client.db("car-doctor").collection("services");
    // get all service
    app.get("/services", async (req, res) => {
      try {
        const services = await servicesCollection.find().toArray();
        res.status(200).send(services);
      } catch (error) {
        res.status(500).send("Server Internal Error");
      }
    });
    // get single service
    app.get("/service/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const service = await servicesCollection.findOne(filter);
        res.status(201).send(service);
      } catch (error) {
        res.status(500).send("Server Internal Error");
      }
    });
    // chekout data
    app.get("/checkout/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const service = await servicesCollection.findOne(filter);
        res.status(201).send(service);
      } catch (error) {
        res.status(500).send("Server Internal Error");
      }
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
