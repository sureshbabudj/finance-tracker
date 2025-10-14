# Bank Statement Analyzer with Firebase Authentication

A React application that analyzes bank statements using Google's Gemini AI and provides secure authentication through Firebase.

## Features

- 🔐 **Firebase Google Authentication** - Secure login with Google accounts
- 📄 **PDF Processing** - Upload and extract text from PDF bank statements
- 🤖 **AI Analysis** - Powered by Google Gemini for transaction categorization
- 📊 **Financial Insights** - Spending analysis and budget recommendations
- 🔍 **Smart Filtering** - Search and filter transactions by category
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bank-statement-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication and set up Google sign-in provider:
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains
4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click "Web app"
   - Copy the configuration object

### 4. Environment Configuration

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration in `.env`:

   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

   VITE_GEMINI_MODEL_NAME=gemini-2.5-flash-preview-05-20
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 5. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### 6. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5500`

## Usage

1. **Sign In**: Click "Sign in with Google" to authenticate
2. **Upload PDF**: Upload your bank statement PDF file
3. **Analysis**: The AI will automatically categorize transactions
4. **Insights**: Generate financial insights and recommendations
5. **Explore**: Use filters to explore your spending patterns

## Security Notes

- All authentication is handled by Firebase
- API keys are stored in environment variables
- User data is processed client-side and not stored permanently
- Firebase handles secure session management

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Authentication**: Firebase Auth with Google provider
- **AI Processing**: Google Gemini API
- **PDF Processing**: PDF.js
- **Styling**: Tailwind CSS

## Development

### Project Structure

```
src/
├── components/           # React components
│   ├── UI.jsx           # Reusable UI components
│   ├── LoginScreen.jsx  # Authentication screen
│   ├── UserProfile.jsx  # User profile dropdown
│   └── LoadingSpinner.jsx
├── hooks/               # Custom React hooks
│   └── useAuth.js       # Authentication hook
├── firebase/            # Firebase configuration
│   └── config.js        # Firebase setup
├── utils/               # Utility functions
│   └── pdfProcessor.js  # PDF and AI processing
├── App.jsx             # Main application component
└── main.jsx            # Application entry point
```

### Environment Variables

All environment variables must be prefixed with `VITE_` to be available in the client-side code.

## Troubleshooting

### Firebase Authentication Issues

1. Ensure your domain is added to Firebase authorized domains
2. Check that Google sign-in provider is enabled
3. Verify all Firebase configuration values are correct

### API Issues

1. Verify your Gemini API key is valid
2. Check network connectivity
3. Review browser console for error messages

### PDF Processing Issues

1. Ensure PDF contains selectable text (not scanned images)
2. Try manually extracting and pasting text as backup
3. Check file size limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
