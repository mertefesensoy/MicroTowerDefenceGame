import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: undefined };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.error) {
            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.title}>🔴 App Crashed</Text>
                        <Text style={styles.label}>Error:</Text>
                        <Text selectable style={styles.errorText}>
                            {this.state.error.message}
                        </Text>
                        <Text style={styles.label}>Stack Trace:</Text>
                        <Text selectable style={styles.stackText}>
                            {this.state.error.stack || "No stack trace available"}
                        </Text>
                    </ScrollView>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1a1a",
    },
    scrollContent: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#ff4444",
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ffffff",
        marginTop: 12,
        marginBottom: 4,
    },
    errorText: {
        fontSize: 14,
        color: "#ff8888",
        fontFamily: "monospace",
    },
    stackText: {
        fontSize: 12,
        color: "#cccccc",
        fontFamily: "monospace",
        lineHeight: 18,
    },
});
