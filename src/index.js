import express from 'express';
const app = express();
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
app.listen(process.env.PORT || 3000, () => console.log("Listening to port 3000"));
