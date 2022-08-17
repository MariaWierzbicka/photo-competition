const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;
    const fileName = file.path.split('/').slice(-1)[0];
    const fileType = fileName.split('.').slice(-1)[0];

    const pattern = new RegExp(/(([A-z]|\s|\.)*)/, 'g');
    const titleMatched = title.match(pattern).join('');
    const authorMatched = author.match(pattern).join('');

    const emailPattern = new RegExp(/[a-z0-9]+((_|\-|\.)?[a-z0-9]+)*@[a-z]+\.[a-z]{2,3}/, 'g');
    const emailMatched = email.match(emailPattern);

    console.log('matched:', emailMatched, 'email:', email);

    if(titleMatched.length < title.length || 
      authorMatched.length < author.length){
      return res.status(500).json({ message: 'invalid characters'});
    };
    if(emailMatched === null || emailMatched.length < email.length){
      return res.status(500).json({ message: 'invalid email format'});
    };

  
    if(title && author && email && file && 
      (fileType === 'gif' || fileType === 'png' || fileType === 'jpg') && 
      title.length <= 25 && author.length <= 50) {
      
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save();
        res.json(newPhoto);
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const voter = await Voter.findOne({user: req.ip});

      if(voter){
        const alreadyVoted = await Voter.findOne({ votes: { $in: [photoToUpdate._id]}});

        if(!alreadyVoted) {
          await Voter.updateOne({_id: voter._id}, { $push: {votes: photoToUpdate._id}});
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({ message: 'OK' });
        } else {
          res.status(500).json({message: 'already voted'});
        }
      }else {
        const newVoter = new Voter({user: req.ip, votes: [photoToUpdate._id]});
        await newVoter.save();

        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
