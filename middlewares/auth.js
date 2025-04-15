import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({error: 'Unauthorized: No token provided'});
    }
    const token = authHeader.split(' ')[1];
    try{
        const decoded =jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;//{userId,role  }
        next();
    }catch (err){
        return res.status(401).json({error: 'Unauthorized: Invalid token'});
    }
};

//Role middleware:Checks if user has the required role
export const authorize = (roles) => {
    return(req,res,next) => {
        if(!req.user || req.user.role !== roles){
            return res.status(403).json({error: 'Forbidden: You do not have permission to access this resource'});
        }
        next();
    };     
};