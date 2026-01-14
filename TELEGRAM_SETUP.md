# Telegram Feedback Bot Setup

## Bot Information
- **Bot Name**: PdfworkshopBot
- **Bot Username**: @PdfworkshopBot
- **Bot Token**: `8545816354:AAHU5EB46OS1qTNl64mzry57dLGCjvJN3ug`

## Setup Instructions

### 1. Get Your Chat ID
To receive feedback messages, you need to get your Telegram chat ID:

1. Open Telegram and search for `@userinfobot`
2. Start a chat with the bot
3. It will send you your chat ID (a number like `123456789`)
4. Copy this chat ID

### 2. Update the FeedbackModal Component
Open `src/components/FeedbackModal.tsx` and replace the `TELEGRAM_CHAT_ID` constant:

```typescript
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID_HERE'; // Replace with your actual chat ID
```

### 3. Start Your Bot
1. Open Telegram and search for `@PdfworkshopBot`
2. Click "Start" to activate the bot
3. The bot is now ready to receive feedback messages

### 4. Test the Integration
1. Use any PDF tool on your website
2. After processing, the feedback modal should appear
3. Submit a rating and feedback
4. Check your Telegram to see if you received the message

## Security Notes

⚠️ **IMPORTANT**: The bot token is currently hardcoded in the frontend code. For production:

1. **Move the token to environment variables**:
   - Create a backend endpoint to handle Telegram messages
   - Store the bot token in `.env` file on the backend
   - Frontend calls your backend, backend sends to Telegram

2. **Example Backend Endpoint** (add to your API):
```python
@app.post("/send_feedback")
async def send_feedback(
    rating: int,
    feedback: str,
    process_type: str
):
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
    
    message = f"""
🔔 New Feedback from PDF Workshop

⭐ Rating: {rating}/5
📝 Tool Used: {process_type}
💬 Feedback: {feedback}
🕐 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data)
        return {"success": response.status_code == 200}
```

## Features

✅ 5-star rating system
✅ Optional text feedback
✅ Automatic popup after successful PDF processing
✅ Buy Me a Coffee integration
✅ Beautiful UI with animations
✅ Telegram notification with formatted message

## Customization

You can customize the feedback modal in `src/components/FeedbackModal.tsx`:
- Change colors and styling
- Modify the feedback form fields
- Adjust the timing of when the modal appears
- Customize the Telegram message format
