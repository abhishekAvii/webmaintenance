# Email Setup Guide

## Quick Start

### 1. Generate Gmail App Password

1. Visit: https://myaccount.google.com/apppasswords
2. If prompted, enable 2-Step Verification first
3. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → Type "WP Maintenance"
4. Click **Generate**
5. Copy the 16-character password (shown without spaces)

### 2. Update Configuration

Open `/Users/imageworksavii/Desktop/app/.env` and update:

```env
SMTP_PASS=your-16-char-password-here
```

### 3. Restart Email Server

```bash
cd /Users/imageworksavii/Desktop/app/server
npm start
```

You should see:
```
🚀 Email server running on http://localhost:3001
✅ SMTP server is ready to send emails
```

### 4. Test Email Sending

1. Open http://localhost:5173
2. Fill in client information
3. Enter a test email address
4. Click "メールを送信" (Send Email)
5. Check the recipient's inbox

## Troubleshooting

### "EAUTH" Error
- App password is incorrect or expired
- Regenerate a new app password
- Make sure there are no spaces in the password

### "ECONNREFUSED" Error
- Email server is not running
- Start it with `npm start` in the server directory

### Email Not Received
- Check spam folder
- Verify the recipient email address
- Check server console for errors

## Current Configuration

- **SMTP Server**: smtp.gmail.com:587
- **From Email**: abhishek.aviiimageworks@gmail.com
- **Sender Name**: AVII IMAGE WORKS
- **Server Port**: 3001

## What Happens When You Send Email

1. User clicks "Send Email" button
2. Frontend generates PDF from the report
3. PDF is converted to base64
4. Sent to backend API at `localhost:3001/api/send-email`
5. Backend sends professional HTML email with PDF attachment via Gmail SMTP
6. Client receives email with:
   - Professional HTML template
   - PDF report attached
   - Maintenance period details
   - Company branding

## Security Notes

- Never commit `.env` file to Git (already in `.gitignore`)
- Keep your app password secure
- Regenerate app password if compromised
- Use environment variables for production deployment
