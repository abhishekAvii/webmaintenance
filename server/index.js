import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify SMTP connection
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP connection error:', error);
    } else {
        console.log('✅ SMTP server is ready to send emails');
    }
});

// Send email endpoint
app.post('/api/send-email', upload.none(), async (req, res) => {
    try {
        const {
            clientEmail,
            clientName,
            periodStart,
            periodEnd,
            pdfBase64,
            fileName
        } = req.body;

        if (!clientEmail || !pdfBase64) {
            return res.status(400).json({
                success: false,
                message: 'クライアントのメールアドレスとPDFが必要です'
            });
        }

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');

        const mailOptions = {
            from: `"${process.env.SENDER_NAME || 'AVII IMAGE WORKS'}" <${process.env.SMTP_USER}>`,
            to: clientEmail,
            subject: `WordPressメンテナンス報告書 - ${new Date().toLocaleDateString('ja-JP')}`,
            html: `
        <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">WordPress メンテナンス報告書</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">WordPress Maintenance Report</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
              ${clientName || 'お客様'}様
            </p>
            
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              いつもお世話になっております。<br>
              WordPressメンテナンス報告書をお送りいたします。
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">対象期間</p>
              <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px; font-weight: bold;">
                ${periodStart} ～ ${periodEnd}
              </p>
            </div>
            
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              詳細は添付のPDFファイルをご確認ください。
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                AVII IMAGE WORKS<br>
                WordPress Maintenance Service
              </p>
            </div>
          </div>
        </div>
      `,
            attachments: [
                {
                    filename: fileName || 'maintenance_report.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'メールが正常に送信されました！'
        });

    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({
            success: false,
            message: `メール送信中にエラーが発生しました: ${error.message}`
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Email server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Email server running on http://localhost:${PORT}`);
});
