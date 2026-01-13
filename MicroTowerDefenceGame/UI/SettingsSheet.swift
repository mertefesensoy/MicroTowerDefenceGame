import SwiftUI
import MicroTDCore

struct SettingsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var appState: AppState
    @ObservedObject var vm: GameViewModel
    
    // Preferences (Auto-persisted)
    @AppStorage("soundEnabled") private var soundEnabled = true
    @AppStorage("hapticsEnabled") private var hapticsEnabled = true
    
    // Local State
    @State private var showResetConfirmation = false
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Audio & Feedback") {
                    Toggle("Sound Effects", isOn: $soundEnabled)
                    Toggle("Haptics", isOn: $hapticsEnabled)
                }
                .disabled(true) // Stubbed for now
                
                Section {
                    Button(role: .destructive) {
                        showResetConfirmation = true
                    } label: {
                        Label("Reset Profile", systemImage: "trash")
                    }
                    .confirmationDialog(
                        "Are you sure?",
                        isPresented: $showResetConfirmation,
                        titleVisibility: .visible
                    ) {
                        Button("Delete All Progress", role: .destructive) {
                            performReset()
                        }
                        Button("Cancel", role: .cancel) { }
                    } message: {
                        Text("This will permanently delete your XP, Level, and Unlocks. This cannot be undone.")
                    }

                } header: {
                    Text("Danger Zone")
                } footer: {
                    if let seed = vm.lastRunSeed, seed != "-" {
                        Text("Last Run Seed: \(seed)")
                    }
                }
                
                Section {
                    Text("MicroTD Version 0.1 (Mission 5)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .listRowBackground(Color.clear)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func performReset() {
        Task {
            do {
                try await appState.runManager?.resetProfile()
                
                // Force game reset
                await MainActor.run {
                    vm.dismissPostRun() // Resets GameState + Timer
                    vm.pause() // Keep paused to let user orient
                    appState.toastManager.show(text: "Profile Reset Complete", icon: "checkmark.shield", color: .green)
                    dismiss()
                }
                
            } catch {
                await MainActor.run {
                    appState.toastManager.showSaveFailure("Reset Failed: \(error.localizedDescription)")
                }
            }
        }
    }
}
