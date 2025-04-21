import Joi from  'joi';



export const registerValidator = Joi.object({
    userName: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.valid(Joi.ref("password")).required().messages({
      "any.only": "Passwords do not match"
    }),
    role: Joi.string().valid("user", "manager", "admin").default("user")
  });
  

export const loginValidator = Joi.object({
    email: Joi.string().email().required(),
    password:Joi.string().min(6).required()
});