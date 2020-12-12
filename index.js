const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectId;


const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('productPic'));
app.use(fileUpload());

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "Library API",
      version: '1.0.0',
    },
  },
  apis: ["index.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));


const port = 5000;
require('dotenv').config();
const dbName =  process.env.DB_NAME;
const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const uri = `mongodb+srv://${username}:${password}@cluster0.plwup.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookstCollection = client.db(dbName).collection("books");
  const booksRequestCollection = client.db(dbName).collection("booksRequest");
  const usersCollection = client.db(dbName).collection("userInfo");

  
  app.post('/addBooks', (req, res) => { //-----------------to add new Books----------------------------
    const file = req.files.file;
    const bookName = req.body.bookName;
    const author = req.body.author;
    const genre = req.body.genre;
    const releaseDate = req.body.releaseDate;
    const activeStatus = req.body.activeStatus == 'true'? true:false;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
    };

    bookstCollection.insertOne({ bookName, author, genre, releaseDate, activeStatus,image  })
        .then(result => {
            res.send(result.insertedCount > 0);
        })
  })

/**
 * @swagger
 * /allBooksBySearch:
 *   get:
 *     description: Get all books, if search value empty then display all books
 *     responses:
 *       200:
 *         description: Success
 * 
 */
  app.get('/allBooksBySearch', (req, res)=>{    //-----------home page product fileter ----------------------------
    const search = req.query.search;
    var regex = new RegExp(["", search, ""].join(""), "i");
    bookstCollection.find({bookName: {$regex: regex }} )
    .toArray( (err, documents) => {
      res.send(documents)
    } )
  })


  /**
 * @swagger
 * /addNewBookRequest:
 *   post:
 *     description: Add a request for new books by user
 *     responses:
 *       201:
 *         description: Success
 * 
 */
  app.post('/addNewBookRequest', (req, res)=>{    //-----------Add a request for new books by user ----------------------------
    const newRequest = req.body;
    booksRequestCollection.insertOne(newRequest)
    .toArray( (err, documents) => {
      res.send(documents)
    } )
  })
  /**
 * @swagger
 * /addNewUser:
 *   post:
 *     description: create a new user 
 *     responses:
 *       201:
 *         description: Success
 * 
 */
  app.post('/addNewUser', (req, res)=>{    //-----------create a  new user ----------------------------
    const newRequest = req.body;
    usersCollection.insertOne(newRequest)
    .toArray( (err, documents) => {
      res.send(documents)
    } )
  })
  /**
 * @swagger
 * /checkUserInfo:
 *   get:
 *     description: check user information. user  login with email and password 
 *     responses:
 *       201:
 *         description: Success
 * 
 */
  app.get('/checkUserInfo', (req, res)=>{    //-----------Find user info to check is user have an account? and check if email and password is same? ----------------------------
    const queryEmail = req.query.email;
    console.log(queryEmail)
    usersCollection.find({email: queryEmail} )
    .toArray( (err, documents) => {
      res.send(documents)
      console.log(documents)
    } )
  })


//   /**
//  * @swagger
//  * /bookRequestList:
//  *   get:
//  *     description: Add a request for new books by user
//  *     responses:
//  *       201:
//  *         description: Success
//  * 
//  */
//   app.get('/bookRequestList', (req, res)=>{    //----------- dont use yet ----------------------------
//     const queryEmail = req.query.email;
//     booksRequestCollection.find({email: queryEmail})
//     .toArray( (err, documents) => {
//       res.send(documents)
//     } )
//   })


   /**
 * @swagger
 * /updateStatus:
 *   patch:
 *     description: Update  books status, if true then it is shown in home page 
 *     responses:
 *       201:
 *         description: Success
 * 
 */
  app.patch('/updateStatus', (req,res)=>{    //----------- update books  stsatus------------------------------
    bookstCollection.updateOne(
      {_id: ObjectId(req.body.id)}, //filter
      { 
        $set: { activeStatus: req.body.activeStatus } //update
      }
    )
    .then(result => {   //option   
      res.send(result.modifiedCount> 0)
    })
  })


    /**
 * @swagger
 * /delete:
 *   delete:
 *     description: Remove a book by admin 
 *     responses:
 *       201:
 *         description: Success
 * 
 */
   app.delete('/delete/:id', (req,res)=>{ // delete data from mongodb
    bookstCollection.deleteOne({_id: ObjectId(req.params.id)})
        .then(result => {
        res.send(result.deletedCount> 0)
        })
     })


       /**
 * @swagger
 * /editBooks:
 *   patch:
 *     description: Update books information
 *     responses:
 *       201:
 *         description: Success
 * 
 */
  app.patch('/editBooks', (req,res)=>{    //----------- update books info------------------------------

   const file = req.files.file
    const id = req.body.id;
    const bookName = req.body.bookName;
    console.log(id)
    const author = req.body.author;
    const genre = req.body.genre;
    const releaseDate = req.body.releaseDate;
    const newImg = file.data;
    const encImg = newImg.toString('base64'); 
    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    };
    bookstCollection.updateOne( 
      {_id: ObjectId(id)}, //filter
      { 
        $set: { bookName: bookName, author:author, genre: genre, releaseDate:releaseDate, image:image } //update 
      }
    )
    .then(result => {   //option   
      res.send(result.modifiedCount> 0)
    })
  })

});



app.listen(process.env.PORT || port) 


