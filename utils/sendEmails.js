import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter =nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
});

export const sendEmail =async({
    to,subject,text,html
}) =>{
    const mailOptions ={
        from:`"Ezbook"<${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
    };
    try{
        const result = await transporter.sendMail(mailOptions);
        return result;
    }catch(err){
        console.error('Email error',err);
        throw new Error('Email sending failed');
    }
};