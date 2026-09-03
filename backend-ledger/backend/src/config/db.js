const mongoose = require("mongoose")



function connectToDB() {

    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("server is connected to DB")
        })
        .catch(err => {
            console.log("Error connecting to DB")
            process.exit(1)
            // iska mtalb hai hum server ko band kar denge if yadi woh db se connect nahi hota hai 
        })

}


module.exports = connectToDB