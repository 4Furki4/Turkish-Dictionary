# Turkish Dictionary

## Project Aim
- The world and languages we use to understand the world are always changing, especially in the modern world. My goal is to create an engaging, non-native speaker-friendly, and up-to-date Turkish dictionary, by also consulting with experts in fields such as science.
- I'll follow the dictionary book that's been used in the [Official Turkish Dictionary](https://sozluk.gov.tr)

## Feature Roadmap
No spesific order yet.
- Minigames to learn or practice Turkish Words and grammar such as randomized letters to find a word and more.
- Contributing to the dictionary by adding pronunciations of the words, and requesting missing words, especially outdated ones, for changes in words.
- Save and learn words. I'll add creating cards to learn words and integrate the saved words to be added to the cards quickly.
- Requesting new features and giving feedback with ease.

## Contribute to the project
- Open issues to report bugs or request features. The guide for opening issues will be added soon.
### The Tech Stack
- create-t3-app with Next 13.5.2 app dir, tRPC, next auth, and drizzle. (Yes, I love type-safety!)
- NextUI
- nodemail
- uploadthing to upload files
- react hook form
- next-intl for internationalization

### Env Variables You Need
````ts
UPLOADTHING_SECRET= // See uploadthing.com to get started.
NODEMAIL_PASSWORD=
NODEMAIL_EMAIL=
DATABASE_URL= // postgres database URL
NEXTAUTH_SECRET= see https://next-auth.js.org/configuration/options#secret
NEXTAUTH_URL= http://localhost:3000
-oAuth Applications-
GOOGLE_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CLIENT_ID=
DISCORD_CLIENT_SECRET=
````
