const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
require('dotenv').config()

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('useNewUrlParser', true);

mongoose.set('useUnifiedTopology', true);

mongoose.set('useFindAndModify', false);

mongoose.connect(process.env.MONGO_URL);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
})

const item2 = new Item({
  name: "Hit the + button to create a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (!err) {
          console.log("Succesfully saved default items to DB.");
        }
      });

      res.redirect("/");
    } else {
      
      res.render("list", {listTitle: "Today", newListItems: foundItems});
      return foundItems;
    }
  });
});


app.get("/foo", function(req, res) {

  NavList.findOne({name: "Today"}, function(err, foundNavList){
    if (!foundNavList) {
      const newNavList = new NavList({
        name: "Today"
      });
      newNavList.save();
    }
  });

  Item.find({}, function(err, foundItems){
    
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (!err) {
          console.log("Succesfully saved default items to DB.");
        }
      });

      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems, navList: navList});
    }
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);


  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        }); 

        list.save(function(err, result) {
          res.redirect("/" + customListName);
        });

      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }


  })

  

 
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$push: {items: item}}, function(err){
      if (!err) {
        res.redirect("/" + listName)
      }
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }
 
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
