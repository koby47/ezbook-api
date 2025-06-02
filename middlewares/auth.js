// import jwt from 'jsonwebtoken';

// export const authenticate = (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if(!authHeader?.startsWith('Bearer ')) {
//         return res.status(401).json({error: 'Unauthorized: No token provided'});
//     }
//     const token = authHeader.split(' ')[1];
//     try{
//         const decoded =jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;//{userId,role  }
//         next();
//     }catch (err){
//         return res.status(401).json({error: 'Unauthorized: Invalid token'});
//     }
// };

import jwt from "jsonwebtoken";
import { UserModel } from "../models/users_models.js"; // import UserModel

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    // ✅ Normalize user data
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      name: user.userName,
      email: user.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};



export const authorize = (roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
      }
      next();
    };
  };
  