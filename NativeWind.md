# NativeWind for Expo Go: Research Document

## Overview

NativeWind is a styling library that brings Tailwind CSS utility classes to React Native, enabling developers to style mobile applications using the familiar Tailwind syntax. It provides a universal styling system that works across iOS, Android, and web platforms.

## What is NativeWind?

NativeWind is a utility-first styling solution for React Native that compiles Tailwind CSS classes into React Native StyleSheet objects. It allows developers to use Tailwind's extensive utility class system (like `flex`, `bg-blue-500`, `p-4`) directly in React Native components, eliminating the need to write traditional StyleSheet code.

**Key Features:**
- **Tailwind CSS compatibility**: Use the same utility classes you would in web development
- **Cross-platform**: Works on iOS, Android, and web with consistent styling
- **TypeScript support**: Full type safety for className properties
- **Dark mode**: Built-in support for responsive dark mode styling
- **Performance**: Styles are compiled at build time for optimal runtime performance

## NativeWind and Expo Go Compatibility

### Current Limitations

NativeWind v2 and v4 require custom native code compilation, which makes them **incompatible with Expo Go**. Expo Go is a sandbox app that cannot include custom native modules or modifications, and NativeWind's core functionality relies on build-time compilation that modifies the Metro bundler configuration.

### Workarounds and Alternatives

**Option 1: Use Expo Dev Client (Recommended)**
Instead of Expo Go, developers can create a custom development build using Expo Dev Client. This approach:
- Allows NativeWind to compile properly with custom Metro configuration
- Provides a development experience similar to Expo Go
- Requires building a custom development app (can be done via EAS Build)

**Option 2: Use twrnc (Tailwind React Native Classnames)**
For developers who must use Expo Go, `twrnc` is an alternative library that:
- Works with Expo Go out of the box
- Provides Tailwind-like styling without build-time compilation
- Uses runtime style generation (slight performance trade-off)
- Syntax: `tw`style="bg-blue-500 p-4"`` instead of `className`

**Option 3: Traditional StyleSheet**
Continue using React Native's StyleSheet API with custom utility functions or style constants that mimic Tailwind's approach.

## Implementation with Expo Dev Client

To use NativeWind with Expo projects (not Expo Go):

1. Install NativeWind and dependencies:
   ```bash
   npm install nativewind
   npm install --save-dev tailwindcss
   ```

2. Initialize Tailwind configuration:
   ```bash
   npx tailwindcss init
   ```

3. Configure `tailwind.config.js`:
   ```javascript
   content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"]
   ```

4. Update `metro.config.js` to include NativeWind transformer

5. Create custom development build:
   ```bash
   npx expo install expo-dev-client
   npx expo prebuild
   ```

6. Use in components:
   ```jsx
   <View className="flex-1 items-center justify-center bg-white">
     <Text className="text-blue-500 font-bold text-xl">Hello World</Text>
   </View>
   ```

## Version Considerations

- **NativeWind v2**: Stable version, widely used, requires custom builds
- **NativeWind v4**: Latest version with improved features and performance, also requires custom builds
- Both versions are incompatible with Expo Go but work with Expo Dev Client

## Conclusion

While NativeWind is not compatible with Expo Go, it remains an excellent styling solution for Expo projects using custom development builds via Expo Dev Client. For teams requiring Expo Go compatibility during development, alternatives like twrnc or traditional StyleSheet approaches are viable options until the team can transition to custom development builds.

## Resources

- NativeWind Documentation: https://www.nativewind.dev
- Expo Dev Client: https://docs.expo.dev/development/introduction/
- twrnc Repository: https://github.com/jaredh159/tailwind-react-native-classnames