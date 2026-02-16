import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ErrorBoundary } from "./src/ErrorBoundary";

export default function App() {
    console.log("App: Rendering Boot OK screen");

    return (
        <ErrorBoundary>
            <View style={styles.container}>
                <Text style={styles.title}>✅ Boot OK</Text>
                <Text style={styles.subtitle}>App initialized successfully</Text>
                <Text style={styles.info}>Minimal boot test - no splash screen</Text>
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0f1e",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#4ade80",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        color: "#ffffff",
        marginBottom: 8,
    },
    info: {
        fontSize: 14,
        color: "#888888",
        marginTop: 16,
    },
});
