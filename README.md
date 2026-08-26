# RRK Bazaar Connect

Build a production-ready, mobile-first PWA called “RRK Bazaar”.



IMPORTANT:

Build the app as a real functional application, not just a UI mockup.

Keep the architecture ready for future Android AAB packaging and Google Play Store publishing.



BRAND:

App name: RRK Bazaar

Tagline: “आपकी जरूरत, आपके पास।”



PWA REQUIREMENTS — VERY IMPORTANT:

Set up the application correctly as an installable Progressive Web App from the beginning.



Include:

- Proper web app manifest

- name: RRK Bazaar

- short_name: RRK Bazaar

- description: RRK Bazaar — आपकी जरूरत, आपके पास।

- start_url: /

- display: standalone

- HTTPS-compatible configuration

- Service Worker

- Proper PWA icons including 192x192 and 512x512

- Theme color and background color

- Mobile viewport configuration

- Android-friendly responsive design



The manifest must be correctly linked and accessible from the production website.



Do not leave the manifest incomplete or missing.



CUSTOMER EXPERIENCE:



When the app is opened for the first time, show:



“RRK Bazaar में आपका स्वागत है”



Then allow the customer to select:



- हिन्दी

- English

- বাংলা

- भोजपुरी



Save the selected language and allow the user to change it later from Settings.



CUSTOMER HOME:



At the very top show:



📍 Deliver to: Select Location



Allow:

- Current GPS location

- Manual location

- Saved addresses



If GPS permission is denied, provide manual address selection.



SEARCH:



Create one easy search area with:



🔍 Text Search

🎤 Voice Search

📷 Photo Search



Text search must understand:

Hindi

Hinglish

English



Voice shopping should support Hindi, Hinglish and English.



When microphone is tapped, say clearly:



“जय हिंद! RRK Bazaar में आपका स्वागत है। क्या चाहिए आपको?”



Use a warm, natural, clear Indian Hindi voice.



PHOTO SEARCH:



Allow the customer to:

- Take a product photo

- Select a photo from gallery

- Search for the matching or visually similar product



If an exact product cannot be found, show similar products instead.



Keep any AI/API secret keys server-side and never expose them in frontend code.



CUSTOMER FEATURES:



- Categories

- Product search

- Product details

- Add to cart

- Quantity controls

- Cart

- Checkout

- Delivery address

- GPS location

- Orders

- Order tracking

- Notifications

- Profile

- Settings

- Language selection



SELLER:



Create a basic seller experience where sellers can:

- Register

- Create shop

- Add products

- Edit products

- Manage stock

- Receive orders

- Accept/reject orders

- Mark order ready for pickup

- View earnings



DELIVERY PARTNER:



Create a delivery partner experience:

- Registration

- Availability

- Available orders

- Accept delivery

- Pickup

- Out for delivery

- Delivered

- Earnings



ADMIN:



Create a basic Super Admin dashboard for:

- Customers

- Sellers

- Shops

- Products

- Orders

- Delivery partners

- Commission

- Settings



SECURITY:



Use proper authentication and role-based access.



Do not expose:

- Passwords

- API keys

- Database credentials

- Payment secret keys

- Service-role keys



Keep secrets in secure environment variables/backend functions.



DESIGN:



Make the application:

- Modern

- Clean

- Fast

- Mobile-first

- Android-friendly

- Easy for Hindi-speaking users

- Large touch-friendly buttons

- Professional and trustworthy



IMPORTANT DEVELOPMENT RULES:



Before creating anything, check the current project structure.



Do not create duplicate pages, duplicate components, duplicate database tables or duplicate authentication.



Build the application in a way that can later be packaged as an Android app.



Do not remove working functionality.



After building, verify:

- PWA manifest

- Service Worker

- 192x192 icon

- 512x512 icon

- HTTPS compatibility

- Mobile responsiveness

- Installability

- Routing

- Authentication

- Voice search

- Photo search



The final PWA must be ready for later Android AAB packaging and Google Play Store deployment.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rrk-bazaar-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ff6074bb-bc45-4b22-b335-e6ffce777a68).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
