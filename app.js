//jshint esversion:6

const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."


});

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];


app.get("/", function (req, res) {

  async function retrieveItems() {
    try {
      const foundItems = await Item.find({});

      if (foundItems.length === 0) {
        await Item.insertMany(defaultItems);
        console.log("Successfully saved default items to DB.");
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    } catch (err) {
      console.log(err);
    }
  }
  retrieveItems();
});

app.get("/:customListName", function (req, res) {
  const customListName =_.capitalize( req.params.customListName);

  async function findOnedocument(customListName) {
    try {
      const result = await List.findOne({ name: customListName }, { name: 1, items: 1 });
      if (!result) {
        console.log("does not exist");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", { listTitle: result.name, newListItems: result.items })
      }
    }
    catch (err) {
      console.log("eroor finding ", err);
    }
  }
  findOnedocument(customListName);
})


app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const title=req.body.list;

  const item = new Item({
    name: itemName
  });

  if(title==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
   async function findOnedocument(itemName,title){
    try {
      let listDoc=await List.findOne({name:title});
     await listDoc.items.push(itemName);
      await listDoc.save() ;
      res.redirect("/"+title);
   }
   catch(err){
    console.log("found err",err);
   }
  }
  findOnedocument(item,title);
}
});

app.post('/delete', function (req, res) {
  const itemId = req.body.checkbox ;
  const title=req.body.list;
  async function deletedocumentbyid(title,id) {
  if(title==="Today"){
      try {
        const result = await Item.deleteOne({ _id: id });
        if (result.deletedCount === 1) {
          console.log("successfully deleted");
        }
  
        else {
          console.log("not deleted successful");
        } 
      } catch (error) {
        console.log(error);
      }
    res.redirect("/");
  }
  else{
      try {
      
         const result=await List.findOneAndUpdate({name:title},{$pull:{items:{_id:id}}});
         if(result){
          console.log("successfully deleted");
         }
        
  
        else { 
          console.log("not deleted successfully");
        }
      }  catch (error) {
        console.log(error);
      }
      res.redirect("/"+title);
    }
  }
  deletedocumentbyid(title,itemId);
});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
