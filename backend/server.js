
// This is the entry point for the backend (aka the index.js file). 
// All backend dependencies are connected here. 
// Mongoose is connected, RESTful routes defined.


const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const expressSession = require("express-session");
const bodyParser = require("body-parser");
const nodemailer = require('nodemailer');
const User = require("./user");
const Hotel = require("./hotels");
var Amadeus = require('amadeus');
const user = require("./user");
require('dotenv').config();

const app = express()
const PORT = 5000

//========================================= MONGODB CONNECT

mongoose.connect(
  process.env.MONGODB_CONNECT,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    () => {
      console.log("Database (MongoDB) is now connected");
    }
  );

//========================================= MIDDLEWARE

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000", // location of react frontend
    credentials: true,
  })
);
app.use(
  expressSession({
    secret: "mondal",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser("mondal"));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);


//========================================= amadeus ROUTES
var amadeus = new Amadeus({
  clientId: process.env.AMADEUS_ID,
  clientSecret: process.env.AMADEUS_SECRET,
});

app.get(`/citySearch`, async (req, res) => { 
  console.log(req.query); 
  var keywords = req.query.keyword; 
  const response = await amadeus.referenceData.locations 
    .get({ 
      keyword: keywords, 
      subType: "CITY,AIRPORT", 
    }) 
    .catch((x) => console.log(x)); 
  try { 
    await res.json(JSON.parse(response.body)); 
  } catch (err) { 
    await res.json(err); 
  } 
});

app.post("/date", async function (req, res) { 
  //console.log(req.body); 
  arrival = req.body.arrival.toString(); 
  locationDeparture = req.body.locationDeparture; 
  locationArrival = req.body.locationArrival; 
  const response = await amadeus.shopping.flightOffersSearch 
    .get({ 
      originLocationCode: locationDeparture, 
      destinationLocationCode: locationArrival, 
      departureDate: arrival.toString(),
      adults: "1", 
    }) 
    .catch((err) => console.log(err)); 
  try { 
    await res.json(JSON.parse(response.body)); 
    //console.log(response.body);
  } catch (err) { 
    await res.json(err); 
  } 
}); 

//========================================= AUTHENTICATION ROUTES

app.get('/google',
  passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('http://localhost:3000/profile');
  });

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send("User does not exist!");
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send("Successfully logged in!");
        //console.log(req.user);
      });
    }
  })(req, res, next);
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.post("/register", (req, res) => {
    User.findOne({ username: req.body.username }, async (err, doc) => {
      if (err) throw err;
      if (doc) res.send("User already exists, please login");
      if (!doc) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
  
        const newUser = new User({
          name: req.body.username,
          mobile: req.body.mobile,
          email: req.body.email,
          password: hashedPassword,
        });
        await newUser.save();
        res.send("Welcome to TRVL!");
      }
    });
  });
  

// =================== User Details ROUTES:

app.get("/getuser", (req, res) => {
  if(!req.user){
    res.send("Please login first")
  }
  if(req.user){
    res.send(req.user);
  }
});

app.post("/update/name", (req, res) => {
  User.findOne({ _id: req.user._id }, async (err, doc) => {
    if (err) throw err;
    if (!doc) res.send("User does not exist!");
    if (doc) {
      doc.name = req.body.name;
      await doc.save();
      res.send("User name updated.");
    }
  });
});

app.post("/update/number", (req, res) => {
  User.findOne({ _id: req.user._id }, async (err, doc) => {
    if (err) throw err;
    if (!doc) res.send("User does not exist!");
    if (doc) {
      doc.mobile = req.body.mobile;
      await doc.save();
      res.send("User mobile updated.");
    }
  });
});

app.post("/update/email", (req, res) => {
  User.findOne({ _id: req.user._id }, async (err, doc) => {
    if (err) throw err;
    if (!doc) res.send("User does not exist!");
    if (doc) {
      doc.email = req.body.email;
      await doc.save();
      res.send("User email updated.");
    }
  });
});

app.post("/update/address", (req, res) => {
  User.findOne({ _id: req.user._id }, async (err, doc) => {
    if (err) throw err;
    if (!doc) res.send("User does not exist!");
    if (doc) {
      doc.address = req.body.address;
      await doc.save();
      res.send("User address updated.");
    }
  });
});


// =================== Hotel ROUTES:

app.get("/gethotels", (req, res) => {
  Hotel.find({}, async(err,doc) => {
    if (!doc) res.send("No hotels in DB");
    if (doc){
      res.send(doc);
    }
  })
});

app.post("/gethotels", (req, res) => {
  Hotel.find({}, async(err,doc) => {
    if (!doc) res.send("No hotels in DB");
    if (doc){
      res.send(doc);
    }
  })
});

app.get("/getfeaturedhotels", (req, res) => {
  Hotel.find({featured : "Y"}, async (err, doc) =>{
    if (err) throw err;
    if (doc){
      res.send(doc);
    }
  });
});

app.get("/viewedhotels", (req, res) => {
  if(!req.user){
    Hotel.find({}, (err,doc) => {
      if (!doc) res.send("No hotels in DB");
      if (doc){
        res.send(doc);
      }
    })
  }
  else{
    Hotel.find({_id : {$in: req.user.visited}}, (err, doc) =>{
      if (err) throw err;
      if (doc){
         res.send(doc.slice(1,6));
      }
    });
  }
  
});

app.post("/hotelsearch", (req, res) => {
  const loc = req.body.searchloc;
 // console.log("destination passed: "+ loc);
  if (loc === ''){
    Hotel.find({}, async (err, doc) =>{
      if (err) throw err;
      if (doc){
         res.send(doc);
        //console.log(doc);
      }
    });
  }
  else{
    Hotel.find({$or: [{location : {$regex: loc, $options: 'i'}},{iata : {$regex: loc, $options: 'i'}}]}, async (err, doc) =>{
      if (err) throw err;
      if (doc){
        await res.send(doc);
        //console.log(doc);
      }
    });
  }
  
});

app.get("/gethotelbyid/:id/:datefrom/:dateto", async (req, res) => {
  let id = req.params.id;
  let d_from = req.params.datefrom;
  let d_to = req.params.dateto;
  Hotel.find({_id : id}, (err, doc) =>{
    if (err) throw err;
    if (doc){
      res.send(doc);
    }
  });
  if (req.user){
    User.findOne({_id: req.user._id}, async (err, doc) =>{
      if (err) throw err;
      if(doc){
        doc.visited.push(id);
        //console.log(doc)
      }
      await doc.save()
    })

  }
});

app.post("/addtobucketlist/:id", (req, res) => {
  if(!req.user){
    res.send("Please login first");
  }
  else{
    Hotel.findOne({_id: req.params.id}, async (err,doc) => {
      if (err) throw err;
      if (doc){
          if (doc.bucketlisted.includes(req.user._id)){
            res.send("Hotel already exists in your bucketlist!");
          }
          else if(doc.bookers.includes(req.user._id)){
            res.send("Product already purchased once!");
          }
          else{
            User.findOne({ _id: req.user._id }, async (err, doc) => {
              if (err) throw err;
              if (!doc) res.send("User does not exist!");
              if (doc) {
                doc.bucketlist.push(req.params.id);
                await doc.save();
                res.send("Property added to bucketlist");
              }
            });
            Hotel.findOne({ _id: req.params.id}, async (err, doc) => {
              if (err) throw err;
              if (!doc) res.send("Hotel does not exist!");
              if (doc) {
                doc.bucketlisted.push(req.user._id);
                await doc.save();
                res.send("New bucketlist-er added!");
              }
            });
          }
      }
    }) 
  }
});

app.post("/bookhotel", (req,res) =>{
  datefrom = new Date(req.body.datefrom);
  dateto = new Date(req.body.dateto);
  Hotel.findOne({_id:req.body.hotelID}, (err,doc)=>{
    if(doc){
      var all = doc.available;
      var selected = all.filter(rangeCheck);
      function rangeCheck(value){
        console.log(value._id)
      }
    }
  })
  res.send("Sab changa si")
})

app.post("/book", (req,res) =>{
  datefrom = req.body.datefrom.toString();
  dateto = req.body.dateto.toString();
  source = req.body.source,
  destination = req.body.destination,
  hotelId = req.body.hotelId,
  hotelcost = req.body.hotelcost,
  hotelname = req.body.hotelname,
  hotellocation = req.body.hotellocation,
  hotelimageurl = req.body.hotelimageurl,
  flightcost = req.body.flightcost,
  flightarrival = req.body.flightarrival,
  flightdeparture = req.body.flightdeparture,
  flightcarriercode = req.body.flightcarriercode,
  flightnumber = req.body.flightnumber,
  carcost = req.body.carcost,
  cartype = req.body.cartype,
  carimageurl = req.body.carimageurl

  if(!req.user){
    res.send("User not logged in!")
  }
  else{
    userID = req.user._id;
  User.findOne({_id: userID}, (err,doc) =>{
    if (err) throw err;
    if (!doc) res.send("User doesn't exist")
    if (doc){
      newBooking = {  source: source, destination: destination, 
                      dateto: dateto, datefrom: datefrom, 
                      hotelId: hotelId, hotelcost: hotelcost, hotelname: hotelname, hotellocation: hotellocation, hotelimageurl: hotelimageurl,
                      carcost: carcost, cartype: cartype, carimageurl: carimageurl, 
                      flightcost: flightcost, flightarrival: flightarrival, flightdeparture: flightdeparture, flightcarriercode: flightcarriercode, flightnumber: flightnumber }
      doc.booked.push(newBooking);
      doc.save();
    }
  })

  if(hotelId!=''){
    Hotel.findOne({_id: hotelId}, (err,doc) => {
      if (err) throw err;
      if (!doc) res.send("Hotel doesn't exist");
      if (doc) {
        doc.bookers.push(userID);
        doc.save();
      }
  
    })
  }

  
  //console.log(hotelcost);
  //console.log(hotelId);
  res.send("Working!!!")
  }
  
})

app.post("/addreview", (req, res) => {
  if(!req.user){
    res.send("Please login first!");
  }
  else{
    Hotel.findOne({ _id: req.body.hotelId}, async (err, doc) => {
      if (err) throw err;
      if (!doc) res.send("Hotel does not exist!");
      if (!req.user) res.send("Login to continue!");
      if (doc && req.user) {
          var newreview = {body: req.body.review, user: req.user.name, verified: "N"};
          doc.reviews.push(newreview);
          await doc.save();
          console.log(newreview)
          res.send("New review added!");

        
      }
    })
  }

});

//========================================= 

app.post("/addhotel", (req, res) => {
 
  const newHotel = new Hotel({
    name: req.body.name,
    location: req.body.location,
    desc: req.body.desc,
    imageurl: req.body.imageurl,
    price: req.body.price,
    rating: req.body.rating,
    amenities: req.body.amenities,
   
  });
  newHotel.save();
  res.send("New product added");

});

//=========================================

app.get("/getbucketlist", (req, res) => {
  if (!req.user) res.send([]);
  if (req.user){
    Hotel.find({_id : {$in: req.user.bucketlist}}, async (err, doc) =>{
      if (err) throw err;
      if (doc){
        await res.send(doc);
        //console.log(doc)
      }
    });
  }
});

app.get("/getbookedhotels", async(req, res) => {

  if (!req.user) res.send([]);
  if (req.user){
    let hotels = [];
    req.user.booked.map((booking) => (
      Hotel.find({_id : booking.hotel_Id}, (err, doc) =>{
        if (err) console.log(err);
        if (doc){
          hotels.push(doc)
        }
      })
    ))
        await res.send(hotels);
        //console.log(hotels)
  }
});

app.get('/userstatus', (req, res) => {
  if (!req.user){
    res.send(false)
    //console.log("Not logged in")
  }
  else{
    res.send(true)
    //console.log("Logged in")
  }
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/recco', (req, res) => {

  var quer = ""

  if (req.user){

    if (req.user.visited.length === 0){
      res.send([])
    }
    else{
      Hotel.findOne({_id: req.user.visited[req.user.visited.length -1]}, (err,doc) => {
        //console.log(doc.tags)
        quer = doc.tags.join(" ");
        Hotel.aggregate([
          {
            '$search': {
              'text': {
                'query': quer, 
                'path': 'tags'
              }
            }
          }, {
            '$project': {
              'name': 1, 
              'location': 1,
              'desc': 1,
              'price': 1,
              'imageurl': 1,
              'amenities': 1,
              'reviews': 1,
              'rating': 1,
              'score': {
                '$meta': 'searchScore'
              }
            }
          }
        ]).exec((err, doc) => {
          if (err) console.log(err);
          //console.log(doc)
          if(doc){
            res.send(doc);
          }
        })
      })
      
    }
    

    }
    else{
      res.send([]);
    //var viewed = ['5fb33f08e8470f63a5c00346'];
    }
    
  
})

app.listen(PORT, () => {
  console.log(`Backend started at http://localhost:${PORT}`)
})
