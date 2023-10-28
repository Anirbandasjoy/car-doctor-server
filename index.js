const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(
  cors({
    origin: ["http://localhost:5174"],
    credentials: true,
  })
);
app.use(cookieParser());
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
    const orderCollection = client.db("car-doctor").collection("order");
    // get all service
    app.post("/jwt", (req, res) => {
      const email = req.body.email;
      const isAdmin = req.body.isAdmin;
      const token = jwt.sign({ email, isAdmin }, process.env.secret, {
        expiresIn: "10h",
      });

      res
        .cookie("AccessToken", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .send({ message: "Success" });
    });

    const verify = (req, res, next) => {
      const token = req.cookies.AccessToken;
      if (!token) {
        return res.status(401).send({ message: "Forbidden Access", code: 401 });
      }
      jwt.verify(token, process.env.secret, (err, decode) => {
        if (err) {
          res.status(403).send({ message: "UnAuthrize", code: 403 });
        }
        req.user = decode;
        next();
      });
    };

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

    // create order

    app.post("/order", async (req, res) => {
      try {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send("Server Internal Error");
      }
    });

    // get order

    app.get("/order", verify, async (req, res) => {
      try {
        if (req.query?.email && req.query.email !== req.user.email) {
          return res.status(403).send("unathorize");
        }

        let email = {};

        if (req.query?.email) {
          email = { email: req.query.email };
        }

        const result = await orderCollection.find(email).toArray();
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send("Server Internal Error", error);
      }
    });

    // delete order

    app.delete("/order/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await orderCollection.deleteOne(filter);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send("Server Internal Error");
      }
    });

    // update order

    app.patch("/order/:id", async (req, res) => {
      const updateOrder = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: updateOrder.status,
        },
      };
      const result = await orderCollection.updateOne(filter, update);
      res.status(200).send(result);
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
