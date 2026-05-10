const mongoose = require('mongoose');
const { mockSlokas } = require('./services/cronJobs'); // wait, mockSlokas is not exported. I'll just write it manually

const data = [
  {id: 1006, teluguMeaning: 'నీకు నిర్దేశించిన కర్మను ఆచరించు, ఎందుకంటే కర్మ చేయకపోవడం కంటే కర్మ చేయడం శ్రేష్ఠం.', hindiMeaning: 'तुम अपना नियत कर्म करो, क्योंकि कर्म न करने की अपेक्षा कर्म करना श्रेष्ठ है।'},
  {id: 1007, teluguMeaning: 'యోగేశ్వరుడైన శ్రీకృష్ణుడు, ధనుర్ధారి అయిన అర్జునుడు ఎక్కడ ఉంటారో, అక్కడ సిరిసంపదలు, విజయం, అసాధారణ శక్తి మరియు నీతి కచ్చితంగా ఉంటాయి.', hindiMeaning: 'जहाँ योगेश्वर श्रीकृष्ण हैं और जहाँ धनुर्धर अर्जुन हैं, वहाँ ऐश्वर्य, विजय, असाधारण शक्ति और नीति निश्चित रूप से होती है।'}
];

mongoose.connect('mongodb://gitawisdom_user:Ratna%402005@ac-toyzhwn-shard-00-00.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-01.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-02.wgi3d9w.mongodb.net:27017/gita_wisdom?ssl=true&replicaSet=atlas-3floza-shard-0&authSource=admin&appName=Cluster0')
.then(async () => {
  console.log('Connected to DB');
  for (let s of data) {
    const res = await mongoose.connection.db.collection('slokas').updateOne(
      { id: s.id },
      { $set: { teluguMeaning: s.teluguMeaning, hindiMeaning: s.hindiMeaning } }
    );
    console.log(`Updated ${s.id}: ${res.modifiedCount} documents`);
  }
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
