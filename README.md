# Chai-aur-bacend
# Push Harder
## How Routing in this app  works
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
    video id ,comment id that particular user liked.
  + if we want the count the search for particular interaction id .for example like
    comment id,video id,tweet id
## Comments model
  + we need to lookup for the videos from the video collection
  + we need to lookup for owner and owner details from users collection 
  
    
## Playlist model
  + while getting the list of user playlists .we should use pagination
  + how to add or delete multiple videos to the playlist at same time 
  

 

