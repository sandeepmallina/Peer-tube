# Chai-aur-bacend
# Push Harder

## middleware
  learn more about middleware [here](https://expressjs.com/en/guide/using-middleware.html)
  + Using middleware
    - Express is a routing and middleware web framework that has minimal functionality of its own: An Express application is essentially a series of middleware function calls.

    - Middleware functions are functions that have access to the request object (req), the response object (res), and the next  middleware function in the application’s request-response cycle. The next middleware function is commonly denoted by a variable named next.

  + Middleware functions can perform the following tasks:

      - Execute any code.
      - Make changes to the request and the response objects.
      - End the request-response cycle.
      - Call the next middleware function in the stack.
      - If the current middleware function does not end the request-response cycle, it must call next() to pass control to the   next middleware function. Otherwise, the request will be left hanging.

  + in app.js we used these cookieParser,static,urlencoded,json,cors
    + `cookieParser` - this used for reading the cookies information 
    + `static` this built in middle ware provided by epxress to get the access of static files from public folder
    + `urlencoded` this is used read information coming from the forms we   body object in req object
    + `json` to read the json data coming from user
    + `cors` this is used to make cross-domain requests 


## How Routing in this app  works
  + In every file of routes we used Router from express this because express.Router(): This creates a new router object. A router behaves like a “mini Express application”, and can be used to define a group of routes that should share the same base path or middleware. For example, you might create a router for all your ‘/users’ routes, and another router for all your ‘/products’ routes. Each router can then have its own .get(), .post(), .put(), etc. methods to handle requests to paths that are relative to the router’s base path.
  while express.Router() provides more flexibility and modularity, especially when you have many routes that should share the same base path or middleware
  + we can also use app.get("/products",(req,res,next)=>{next()},(req, res) =>{res.send("Hellow)}) .but this simple way of difing routes.it doesn't provide modularity 
  + `app.use("/api/v1/users", userRouter);` this line of code says that if the client hit the endpoint starting with `/api/v1/users` then `userRouter` gets executed .In the userRouter we use const router=Router();
  + [refer here](https://sl.bing.net/clvBjLe36Rg) about routing used in the app 
  
## steps taken to implement user controller 
  - get user details from frontend
  - validation — not empty
  - check if user already exists: username, email
  - check for images, check for avatar
  - upload them to cloudinary, avatar
  - create user object — create entry in db
  - remove password and refresh token field from response
  - check for user creation
  - return res

## steps taken to implement Video controller 

### TODO:
+ how deal with user who looiking our videos with login ?
  + can we create array or views for a video ?

+ how deal with user who looiking our videos many times  ?
  + if user watches a single video many times then we shoudl the id every time 
    - No,we can use addToSet is used avoid duplicate      entries to the array
  + how to deal with the duplicate views ?


## controller of tweet
 - CRUD operations on tweet 
    - Create tweet:
      + get user _id from the verify jwt middleware
      + get the tweetcontent from the res.body
      + model.create used to create the tweet document
    - Read 
      + get all tweet to show in the front end
      + get the user based based on the user id
    - Update
      + use findOneAndUpdate .fill the fields for owner id from middle ware and tweet id 
      + if updated successfully it returns the updated document 
      + if not variable will be null
      + throw error user not match
    - Delete 
      + use findOneAndDelete .fill the fields for owner id from middleware and tweet id  form req.params
      + if deleted successfully it returns the deleted document '

## how does a like model work
  + for every user interaction we create a document of liked by (user id ),
    video id or  comment id or tweeid  with user id.
  + if we want the count for the comment likes  on a video .then we can count the number of comments
    same for tweets likes 
  + if we want to toggle the like if the videoId and userId is present in the same document  we can delete the like document from  like collection
   ! TODO:Add the aggregatePagginate for likes 

## Comments model
  + we need to lookup for the videos from the video collection
  + we need to lookup for owner and owner details from users collection 
  
    
## Playlist model
  + while getting the list of user playlists .we should use pagination
  + how to add or delete multiple videos to the playlist at same time 
  

 

