import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/users_models.js'; 
import { registerValidator,loginValidator } from '../validators/users_validators.js';
import { sendEmail } from '../utils/sendEmails.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async(req,res) => {
    try{
        const{error,value} = registerValidator
        .validate(req.body,{abortEarly:false});
        if(error)return res.status(400)
          .json({error:"Email already exists"});

        value.password = await bcrypt.hash(value.password,10);
        const user = await UserModel.create(value
          );

        await sendEmail({
          to: user.email,
          subject: "Welcome to EzBook!",
          text: `Hi ${user.userName}, welcome to EzBook!`,
          html: `
            <h2>Welcome to EzBook, ${user.userName}!</h2>
            <p>Your account has been successfully created.</p>
            <p>We’re excited to have you onboard.</p>
          `
        });
       
        res.status(201).json({message:"User registered successfully",user});
     } catch(error){
        res.status(500).json({error:"Registration failed"});
     }
}

export const loginUser = async (req, res) => {
    try {
      const { error, value } = loginValidator.validate(req.body, { abortEarly: false });
      if (error) return res.status(422).json({ errors: error.details.map(e => e.message) });
  
      const user = await UserModel.findOne({ email: value.email });
      if (!user) return res.status(404).json({ error: "Invalid credentials" });
  
      const match = await bcrypt.compare(value.password, user.password);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });
  
      const token = jwt.sign(
        { userId: user._id, role: user.role },
         JWT_SECRET,
          { expiresIn: "7d", algorithm: "HS256" });
  
      res.json({ message: "Login successful", token, user });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  };
  