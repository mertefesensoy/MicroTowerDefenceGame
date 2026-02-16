import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { RelicDef } from '../core/definitions/RelicDef';

interface RelicChoiceModalProps {
    visible: boolean;
    choices: RelicDef[];
    onChoose: (index: number) => void;
}

export function RelicChoiceModal({ visible, choices, onChoose }: RelicChoiceModalProps) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Choose a Relic</Text>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {choices.map((relic, index) => (
                            <TouchableOpacity
                                key={relic.id}
                                style={[styles.card, styles[relic.rarity]]}
                                onPress={() => onChoose(index)}
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={styles.relicName}>{relic.name}</Text>
                                    <Text style={styles.rarity}>{relic.rarity.toUpperCase()}</Text>
                                </View>
                                <Text style={styles.description}>{relic.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    scrollContent: {
        gap: 12,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: '#0f0f1e',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    relicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    rarity: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#888',
    },
    description: {
        color: '#ccc',
        fontSize: 14,
    },
    // Rarity styles
    common: { borderColor: '#888' },
    uncommon: { borderColor: '#16f2b3' },
    rare: { borderColor: '#00b4d8' },
    legendary: { borderColor: '#ffd700' },
});
