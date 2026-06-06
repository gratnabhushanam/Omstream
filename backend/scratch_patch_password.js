const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = "mongodb://gitawisdom_user:Ratna%402005@ac-toyzhwn-shard-00-00.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-01.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-02.wgi3d9w.mongodb.net:27017/gita_wisdom?ssl=true&replicaSet=atlas-3floza-shard-0&authSource=admin&appName=Cluster0";

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to DB");
    
    const hashedPassword = await bcrypt.hash("Ratnapavan@7896", 8);
    const result = await User.updateOne(
      { email: "gitawisdom143@gmail.com" },
      { $set: { password: hashedPassword, role: "admin" } }
    );
    
    console.log("Update result:", result);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
