# WordPress Maintenance Report Generator

A professional WordPress maintenance report generator with PDF export and email functionality.

## Features

- ✅ Generate professional PDF reports
- ✅ Send reports via email using SMTP
- ✅ Live preview toggle
- ✅ Multi-page PDF support with intelligent page breaks
- ✅ Icon and text alignment optimization
- ✅ Upload analytics screenshots
- ✅ Customizable maintenance checklist

## Setup Instructions

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 2. Email Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env
```

### 3. Configure SMTP Settings

Edit the `.env` file with your SMTP credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDER_NAME=AVII IMAGE WORKS
PORT=3001
```

#### For Gmail Users:

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password
4. Use this App Password in the `SMTP_PASS` field

### 4. Start the Email Server

```bash
# From the server directory
npm start

# Or for development with auto-reload
npm run dev
```

The email server will run on `http://localhost:3001`

## Usage

1. **Fill in the form** with client information, maintenance tasks, and report details
2. **Toggle Preview** to see the live PDF preview
3. **Generate PDF** to download the report
4. **Send Email** to automatically email the PDF to the client

## Project Structure

```
app/
├── src/
│   ├── App.tsx          # Main application component
│   ├── components/      # UI components
│   └── ...
├── server/
│   ├── index.js         # Email server with SMTP
│   └── package.json
├── .env.example         # Environment variables template
└── package.json
```

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, jsPDF, html2canvas
- **Backend**: Express.js, Nodemailer
- **Email**: SMTP (Gmail, SendGrid, etc.)

## Troubleshooting

### Email not sending?

1. Check that the email server is running on port 3001
2. Verify your SMTP credentials in `.env`
3. For Gmail, ensure you're using an App Password, not your regular password
4. Check the server console for error messages

### PDF not generating?

1. Ensure all images are loaded before generating
2. Check browser console for errors
3. Try toggling the preview on before generating

## License

MIT
