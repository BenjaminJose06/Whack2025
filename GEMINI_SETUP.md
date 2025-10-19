# Gemini AI Integration Setup

## Overview
This application now includes AI-powered transaction analysis using Google's Gemini API. The AI analyzes your spending patterns and provides personalized insights, saving opportunities, and budgeting recommendations.

## Setup Instructions

### 1. Get Your Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment Variables
Create a `.env` file in the project root directory with the following content:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-here

# Plaid API Configuration (for bank integration)
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_plaid_secret_here
PLAID_ENV=sandbox

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace `your_gemini_api_key_here` with the API key you obtained in step 1.

### 3. Install Dependencies
The `google-generativeai` package has already been added to `requirements.txt`. If you need to install it manually:

```bash
pip install google-generativeai
```

## Features

### AI Transaction Analysis
Once configured, the Banking Portal will display an "AI Financial Analysis" section after connecting your bank account. Click the "Analyze with AI" button to receive:

- **Key Insights**: 2-3 bullet points about your spending patterns
- **Saving Opportunities**: Specific areas where you can reduce spending
- **Budgeting Recommendations**: Practical tips tailored to your spending profile
- **Action Items**: 3 concrete steps to improve your financial health

### How It Works
1. Connect your bank account through Plaid
2. Transaction data is automatically fetched
3. Click "Analyze with AI" in the Banking Portal
4. Gemini AI analyzes your spending patterns and categories
5. Receive personalized, actionable financial advice

## Privacy & Security
- Transaction data is only sent to Gemini API when you explicitly click "Analyze with AI"
- No data is stored by Google beyond the API call
- All communication is encrypted via HTTPS
- Your API key is stored locally in your `.env` file

## Troubleshooting

### "Gemini API not configured" Error
- Make sure `GEMINI_API_KEY` is set in your `.env` file
- Verify the API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Restart your Flask server after adding the environment variable

### API Rate Limits
The free tier of Gemini API has the following limits:
- 60 requests per minute
- 1,500 requests per day

If you exceed these limits, you'll receive an error. Wait a few minutes before trying again.

## Model Information
This application uses `gemini-1.5-flash`, which is:
- Available on the free tier
- Fast and efficient for financial analysis
- Optimized for quick responses

## Cost
Google's Gemini API offers a generous free tier that should be sufficient for most personal use cases:
- **Free tier**: 15 requests per minute, 1,500 requests per day
- Check the [official pricing page](https://ai.google.dev/pricing) for current rates if you need higher limits

