import SwiftUI
import Combine

struct ToastMessage: Equatable, Identifiable {
    let id = UUID()
    let text: String
    let icon: String // SF Symbol
    let color: Color
}

@MainActor
final class ToastManager: ObservableObject {
    @Published var currentToast: ToastMessage?
    
    private var lastMessage: String?
    private var lastMessageTime: Date?
    
    // Show a toast with simple dedupe logic
    func show(text: String, icon: String = "info.circle", color: Color = .white) {
        // Dedupe: Don't show same message if < 3s has passed
        if let last = lastMessage, 
           let time = lastMessageTime, 
           last == text, 
           Date().timeIntervalSince(time) < 3 {
            return
        }
        
        // Update state
        let newToast = ToastMessage(text: text, icon: icon, color: color)
        withAnimation {
            currentToast = newToast
        }
        
        lastMessage = text
        lastMessageTime = Date()
        
        // Auto-dismiss
        Task {
            try? await Task.sleep(nanoseconds: 4_000_000_000) // 4s
            if currentToast?.id == newToast.id {
                withAnimation {
                    currentToast = nil
                }
            }
        }
    }
    
    // MARK: - Specialized Helpers
    
    func showSaveFailure(_ error: String) {
        show(text: "Save Failed: \(error)", icon: "exclamationmark.triangle", color: .red)
    }
    
    func showProtectedDataWarning() {
        show(text: "Device Locked - Saving Deferred", icon: "lock.fill", color: .yellow)
    }
}
