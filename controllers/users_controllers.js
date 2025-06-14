import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/users_models.js'; 
import { registerValidator,loginValidator } from '../validators/users_validators.js';
import { sendEmail } from '../utils/sendEmails.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { verifyGoogleToken } from '../utils/firebaseAdmin.js';
import crypto from 'crypto'



const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async(req,res) => {
    try{
        const{error,value} = registerValidator
        .validate(req.body,{abortEarly:false});
        
        if (error) {
          return res.status(422).json({
            errors: error.details.map(e => e.message)
          });
        }

       
        //hash password
        value.password = await bcrypt.hash(value.password,10);

        //  Remove confirmPassword so Mongoose doesn't throw
          delete value.confirmPassword;

          //Generate verification token
          const token =crypto.randomBytes(32).toString("hex");
          const expires =new Date(Date.now()+24*60*60*1000);//expires in 24h

          value.verificationToken = token;
          value.verificationTokenExpires =expires;

          //Now save to DB
        const user = await UserModel.create(value
          );

          const verificationLink =`https://ezbook-api.onrender.com/api/user/verify-email?token=${token}`;

        await sendEmail({
          to: user.email,
          subject: "Verify Your Email for Ezbook",
          text: `Hi ${user.userName}, welcome to EzBook!`,
          html: `
            <h2>Hello ${user.userName}</h2>
            <p>Your account has been successfully created.</p>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
            <p>We’re excited to have you onboard.</p>
          `
        });
       
        res.status(201).json({message:"User registered successfully.Please verify your email",user});
     } catch(error){
      console.error("Registration error:",error);
        res.status(500).json({error:"Registration failed"});
     }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await UserModel.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      // Redirect to "invalid token" page on frontend
      return res.redirect("https://ezbooki.netlify.app/invalid-token");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Redirect to "email verified" page on frontend
    res.redirect("https://ezbooki.netlify.app/email-verified");
  } catch (err) {
    console.error("Email verification error:", err);
    res.redirect("https://ezbooki.netlify.app/error-verifying");
  }
};


export const loginUser = async (req, res) => {
    try {
      const { error, value } = loginValidator.validate(req.body, { abortEarly: false });
      if (error) return res.status(422).json({ errors: error.details.map(e => e.message) });
  
      const user = await UserModel.findOne({ email: value.email });
      if (!user) return res.status(404).json({ error: "Invalid credentials" });

      //check if email is verified
      if(!user.isVerified){
        return res.status(403).json({error:"Email Not Verified"})
      }
  
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
  
  export const getCurrentUser = async(req,res) =>{
    try{
      const user = req.user;
      res.status(200).json({user}); 
    }catch(err){
      res.status(500),json({error:"Error fetching current user"});
    }
  };

  export const getAllUsers = async (req, res) => {
    try {
      const {
        role,
        email,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        order = "desc",
        exportFormat
      } = req.query;
  
      const filter = {};
      if (role) filter.role = role;
      if (email) filter.email = { $regex: email, $options: "i" };
  
      const skip = (page - 1) * limit;
      const sortOrder = order === "asc" ? 1 : -1;
  
      const users = await UserModel
        .find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .select("-password");
  
      const total = await UserModel.countDocuments(filter);
  
      //  CSV Export
      if (exportFormat === "csv") {
        const fields = ["_id", "userName", "email", "role"];
        const parser = new Parser({ fields });
        const csv = parser.parse(users);
        res.header("Content-Type", "text/csv");
        res.attachment("users.csv");
        return res.send(csv);
      }
  
      //  PDF Export
      if (exportFormat === "pdf") {
        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=users.pdf");
  
        doc.fontSize(18).text("EzBook - All Users", { align: "center" });
        doc.moveDown();
  
        users.forEach((user, index) => {
          doc
            .fontSize(12)
            .text(`${index + 1}. ${user.userName} | ${user.email} | ${user.role}`);
        });
  
        doc.end();
        doc.pipe(res); // Pipe PDF output to response stream
        return;
      }
  
      // Default JSON response
      res.status(200).json({
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        users
      });
  
    } catch (error) {
      console.error("Error fetching users:", error.message);
      res.status(500).json({ error: "Error fetching users" });
    }
  };
  
  export const googleLogin = async (req, res) => {
  try {
    const { token,role } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const googleUser = await verifyGoogleToken(token);
    const { email, name, picture } = googleUser;

    // Check if user exists
    let user = await UserModel.findOne({ email });

    if (!user) {
      // only allow 'user' or 'manager' role(prevent spoofing)
      const validRole =['user','manager'].includes(role) ? role :'user';

      user = await UserModel.create({
        email,
        userName: name,
        avatar: picture,
        role: validRole, // or allow manager selection
        fromGoogle:true,   //Flag for Google users
        isVerified:true   //Mark Google users as verified
      });
    }

    // Generate JWT
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        username: user.userName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error("Google login failed:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
