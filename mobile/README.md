# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Configuration

1. Create a `.env.local` file in the mobile directory:

   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.7:3000
   ```

   Update the IP address and port to match your backend API server.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Features

### Survey Collection (Coleta de Pesquisa)

The app includes a comprehensive survey collection feature that allows researchers to:

1. **Login**: Authenticate with your access code and password
2. **Select Location**: Choose the site/location where the survey will be conducted
3. **Select Survey**: Pick the questionnaire to apply
4. **Answer Questions**: Respond to various question types:
   - Text input
   - Numeric input
   - Multiple choice (select)
   - Boolean (Yes/No)
   - Likert scale (1-5)
5. **Submit**: Send responses to the backend API

### Navigation

- **Pesquisas Tab**: Main entry point for starting a survey collection
- **Modal Screen**: The survey collection interface opens as a modal from the Pesquisas tab
- **Login Screen**: Automatic authentication check with redirect to login if needed

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
