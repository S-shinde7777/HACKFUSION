const express = require("express");
const cors=require("cors");
const app = express();

app.use(cors());
app.use(express.json());

//routes
const requestRoutes = require("./routes/requestRoutes");
const medicineRoutes = require("./routes/medicineRoutes");

app.use("/api",requestRoutes);
app.use("/api",medicineRoutes);

const PORT=5000;
app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
});