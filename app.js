const express = require('express');
const path = require('path');
const port = 4040;
const app = express();

const bodyParser = require('body-parser');

const csvFilePath=__dirname+'/demo.csv';
const csv=require('csvtojson');
let data = null;

//bodyparser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, '/public')));


//views setup
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs' );

//mongodb setup
const MongoCLient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const url = 'mongodb://127.0.0.1:27017/QuestionBank';



// use body parser to parse form data
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

//db setup
MongoCLient.connect(url , (err,database)=>{
    if(err){
       return console.log('failed to connect');
    }
    console.log('database connected');
    const db = database;
    const Question= db.collection('Question');

   //parsing the csv file
     csv()
    .fromFile(csvFilePath)
    .on('json',(jsonObj)=>{
        // combine csv header row and csv line to a json object 
        // jsonObj.a ==> 1 or 4 
        
        data = jsonObj;
        // console.log(data);

        //inserting data in the database
        Question.insert(data, (err, result)=>{
            if(err){
                return;
            }
            console.log(JSON.stringify(result));
            
        });
    })
    .on('done',(error)=>{
        console.log('end');

        app.get('/', (req, res)=>{
            Question.find({}).toArray((err, data) =>{
                if(err){
                  return   res.status(503).json({
                        status : 'failed',
                        message: 'something wrong'
                    });
                }
               return res.status(200).json({
                        data
                    });
            });
        });
        app.delete('/delete/:id', (req, res)=>{
               try{
                   const query = {_id : ObjectID(req.params.id)};
                   Question.deleteOne(query, (err, data)=>{
                       if(err){
                           console.log(err);
                           return res.status(503).json({
                               status : 'failed',
                               message : 'something wrong'
                            });
                        }
                        if(data.deletedCount == 0){
                            return res.status(404).json({
                                status: 'failed',
                                message : 'not found'
                            });
                        }

                        res.status(200).json({
                            status: 'sucess',
                            message: 'deleted'
                        });
                    });
                }

               catch(err){
                   res.status(503).json({
                       status: 'failed',
                       message: 'something is wrong'
                   });
                }
            });

            app.patch('/update/:id', (req, res)=> {
                let Question_Title = req.body.question || null;
                let Question_Desc = req.body.q_desc;
                let Opt_A = req.body.opt_a || null;
                let Opt_B = req.body.opt_b || null;
                let Opt_C = req.body.opt_c || null;
                let Opt_D = req.body.opt_d || null;
                let Answer  = req.body.answer || null;
                let Image_Path= req.body.img_path || null;

                let updateFields = {};

                if(Question_Title && Question_Title.length > 8) {
                    updateFields.Question_Title = Question_Title;
                }
                
                if(Question_Desc && Question_Desc.length >10){
                   updateFields.Question_Desc = Question_Desc;
                }

                if(Opt_A){
                    updateFields.Opt_A = Opt_A;
                }
                if(Opt_B){
                    updateFields.Opt_B = Opt_B;
                }
                if(Opt_C){
                    updateFields.Opt_C = Opt_C;
                }
                if(Opt_D){
                    updateFields.Opt_C = Opt_D;
                }
                if(Answer){
                    updateFields.Answer = Answer;
                }
                if(Image_Path){
                    updateFields.Image_Path = Image_Path;
                }

                console.log(updateFields);
        

                if(Object.keys(updateFields).length === 0 && updateFields.constructor === Object) {
                    return res.status(200).json({
                        status : 'success',
                        message : 'nothing to update'
                    });
                }

                try{
                    const query = {_id : ObjectID(req.params.id)};
                    Question.updateOne(query, { $set : updateFields}, 
                    (err, data)=>{
                        // console.log('**Result =>',data);
                        if(err){
                            return res.status(503).json({
                                status: 'failed',
                                message: 'something went wrong'
                            });
                        }
                        if(query == null){
                            return res.status(503).json({
                                status:'failed',
                                message:'not found'

                            });
                        }

                        res.status(200).json({
                            data: data
                        });
                        
                    });
                }
                catch(err){
                    return res.status(503).json({
                        status:'failed',
                        message:'invalid'
                    });
                }
            });


        //end of done 
    });
    //end of db braces
});

app.listen(port, ()=>{
      console.log('listen at port no:' +port);
  });